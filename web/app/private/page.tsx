'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, LogarithmicScale,
  BarElement, LineElement, PointElement, Filler,
  Tooltip, Legend,
} from 'chart.js'
import { Chart } from 'react-chartjs-2'
import spDesc from '@/app/sp500-holdings/descriptions.json'
import PrivateTabs from '@/components/PrivateTabs'
import { WRITTEN_INSIGHTS, WRITTEN_AS_OF } from './insights'
import { DEEP_INSIGHTS, type DeepInsight } from './deep'
import { classify, GROUPS, GRADE_LABEL, gradeColor, groupColor, qualityScore, fmt, fmtSgn, type Metrics, type Quality, type GroupKey } from '@/lib/ideas'
import { EXTRA_METRICS } from './ideas/picks'
import qldData        from '@/public/data/rolling/QLD_rolling.json'
import qqqData        from '@/public/data/rolling/QQQ_rolling.json'
import tqqqData       from '@/public/data/rolling/TQQQ_rolling.json'
import aData          from '@/public/data/rolling/A_rolling.json'
import aaplData       from '@/public/data/rolling/AAPL_rolling.json'
import abbvData       from '@/public/data/rolling/ABBV_rolling.json'
import abtData        from '@/public/data/rolling/ABT_rolling.json'
import acglData       from '@/public/data/rolling/ACGL_rolling.json'
import acnData        from '@/public/data/rolling/ACN_rolling.json'
import adbeData       from '@/public/data/rolling/ADBE_rolling.json'
import adiData        from '@/public/data/rolling/ADI_rolling.json'
import admData        from '@/public/data/rolling/ADM_rolling.json'
import adpData        from '@/public/data/rolling/ADP_rolling.json'
import adskData       from '@/public/data/rolling/ADSK_rolling.json'
import aeeData        from '@/public/data/rolling/AEE_rolling.json'
import aepData        from '@/public/data/rolling/AEP_rolling.json'
import aesData        from '@/public/data/rolling/AES_rolling.json'
import aflData        from '@/public/data/rolling/AFL_rolling.json'
import aigData        from '@/public/data/rolling/AIG_rolling.json'
import aizData        from '@/public/data/rolling/AIZ_rolling.json'
import ajgData        from '@/public/data/rolling/AJG_rolling.json'
import akamData       from '@/public/data/rolling/AKAM_rolling.json'
import albData        from '@/public/data/rolling/ALB_rolling.json'
import algnData       from '@/public/data/rolling/ALGN_rolling.json'
import allData        from '@/public/data/rolling/ALL_rolling.json'
import alleData       from '@/public/data/rolling/ALLE_rolling.json'
import amatData       from '@/public/data/rolling/AMAT_rolling.json'
import amcrData       from '@/public/data/rolling/AMCR_rolling.json'
import amdData        from '@/public/data/rolling/AMD_rolling.json'
import ameData        from '@/public/data/rolling/AME_rolling.json'
import amgnData       from '@/public/data/rolling/AMGN_rolling.json'
import ampData        from '@/public/data/rolling/AMP_rolling.json'
import amtData        from '@/public/data/rolling/AMT_rolling.json'
import amznData       from '@/public/data/rolling/AMZN_rolling.json'
import anetData       from '@/public/data/rolling/ANET_rolling.json'
import aonData        from '@/public/data/rolling/AON_rolling.json'
import aosData        from '@/public/data/rolling/AOS_rolling.json'
import apaData        from '@/public/data/rolling/APA_rolling.json'
import apdData        from '@/public/data/rolling/APD_rolling.json'
import aphData        from '@/public/data/rolling/APH_rolling.json'
import apoData        from '@/public/data/rolling/APO_rolling.json'
import aptvData       from '@/public/data/rolling/APTV_rolling.json'
import areData        from '@/public/data/rolling/ARE_rolling.json'
import aresData       from '@/public/data/rolling/ARES_rolling.json'
import atoData        from '@/public/data/rolling/ATO_rolling.json'
import avgoData       from '@/public/data/rolling/AVGO_rolling.json'
import avyData        from '@/public/data/rolling/AVY_rolling.json'
import awkData        from '@/public/data/rolling/AWK_rolling.json'
import axonData       from '@/public/data/rolling/AXON_rolling.json'
import axpData        from '@/public/data/rolling/AXP_rolling.json'
import azoData        from '@/public/data/rolling/AZO_rolling.json'
import baData         from '@/public/data/rolling/BA_rolling.json'
import bacData        from '@/public/data/rolling/BAC_rolling.json'
import ballData       from '@/public/data/rolling/BALL_rolling.json'
import baxData        from '@/public/data/rolling/BAX_rolling.json'
import bbyData        from '@/public/data/rolling/BBY_rolling.json'
import bdxData        from '@/public/data/rolling/BDX_rolling.json'
import benData        from '@/public/data/rolling/BEN_rolling.json'
import bfbData        from '@/public/data/rolling/BF-B_rolling.json'
import bgData         from '@/public/data/rolling/BG_rolling.json'
import biibData       from '@/public/data/rolling/BIIB_rolling.json'
import bkngData       from '@/public/data/rolling/BKNG_rolling.json'
import bkrData        from '@/public/data/rolling/BKR_rolling.json'
import blkData        from '@/public/data/rolling/BLK_rolling.json'
import bmyData        from '@/public/data/rolling/BMY_rolling.json'
import bnyData        from '@/public/data/rolling/BNY_rolling.json'
import brData         from '@/public/data/rolling/BR_rolling.json'
import brkbData       from '@/public/data/rolling/BRKB_rolling.json'
import broData        from '@/public/data/rolling/BRO_rolling.json'
import bsxData        from '@/public/data/rolling/BSX_rolling.json'
import bxData         from '@/public/data/rolling/BX_rolling.json'
import bxpData        from '@/public/data/rolling/BXP_rolling.json'
import cData          from '@/public/data/rolling/C_rolling.json'
import cahData        from '@/public/data/rolling/CAH_rolling.json'
import casyData       from '@/public/data/rolling/CASY_rolling.json'
import catData        from '@/public/data/rolling/CAT_rolling.json'
import cbData         from '@/public/data/rolling/CB_rolling.json'
import cboeData       from '@/public/data/rolling/CBOE_rolling.json'
import cbreData       from '@/public/data/rolling/CBRE_rolling.json'
import cciData        from '@/public/data/rolling/CCI_rolling.json'
import cclData        from '@/public/data/rolling/CCL_rolling.json'
import cdnsData       from '@/public/data/rolling/CDNS_rolling.json'
import cdwData        from '@/public/data/rolling/CDW_rolling.json'
import cfData         from '@/public/data/rolling/CF_rolling.json'
import cfgData        from '@/public/data/rolling/CFG_rolling.json'
import chdData        from '@/public/data/rolling/CHD_rolling.json'
import chrwData       from '@/public/data/rolling/CHRW_rolling.json'
import chtrData       from '@/public/data/rolling/CHTR_rolling.json'
import ciData         from '@/public/data/rolling/CI_rolling.json'
import cienData       from '@/public/data/rolling/CIEN_rolling.json'
import cinfData       from '@/public/data/rolling/CINF_rolling.json'
import clData         from '@/public/data/rolling/CL_rolling.json'
import clxData        from '@/public/data/rolling/CLX_rolling.json'
import cmcsaData      from '@/public/data/rolling/CMCSA_rolling.json'
import cmeData        from '@/public/data/rolling/CME_rolling.json'
import cmgData        from '@/public/data/rolling/CMG_rolling.json'
import cmiData        from '@/public/data/rolling/CMI_rolling.json'
import cmsData        from '@/public/data/rolling/CMS_rolling.json'
import cncData        from '@/public/data/rolling/CNC_rolling.json'
import cnpData        from '@/public/data/rolling/CNP_rolling.json'
import cofData        from '@/public/data/rolling/COF_rolling.json'
import cooData        from '@/public/data/rolling/COO_rolling.json'
import copData        from '@/public/data/rolling/COP_rolling.json'
import corData        from '@/public/data/rolling/COR_rolling.json'
import costData       from '@/public/data/rolling/COST_rolling.json'
import cpayData       from '@/public/data/rolling/CPAY_rolling.json'
import cprtData       from '@/public/data/rolling/CPRT_rolling.json'
import cptData        from '@/public/data/rolling/CPT_rolling.json'
import crlData        from '@/public/data/rolling/CRL_rolling.json'
import crmData        from '@/public/data/rolling/CRM_rolling.json'
import cscoData       from '@/public/data/rolling/CSCO_rolling.json'
import csgpData       from '@/public/data/rolling/CSGP_rolling.json'
import csxData        from '@/public/data/rolling/CSX_rolling.json'
import ctasData       from '@/public/data/rolling/CTAS_rolling.json'
import ctshData       from '@/public/data/rolling/CTSH_rolling.json'
import cvsData        from '@/public/data/rolling/CVS_rolling.json'
import cvxData        from '@/public/data/rolling/CVX_rolling.json'
import dData          from '@/public/data/rolling/D_rolling.json'
import dalData        from '@/public/data/rolling/DAL_rolling.json'
import ddData         from '@/public/data/rolling/DD_rolling.json'
import deData         from '@/public/data/rolling/DE_rolling.json'
import deckData       from '@/public/data/rolling/DECK_rolling.json'
import dgData         from '@/public/data/rolling/DG_rolling.json'
import dgxData        from '@/public/data/rolling/DGX_rolling.json'
import dhiData        from '@/public/data/rolling/DHI_rolling.json'
import dhrData        from '@/public/data/rolling/DHR_rolling.json'
import disData        from '@/public/data/rolling/DIS_rolling.json'
import dlrData        from '@/public/data/rolling/DLR_rolling.json'
import dltrData       from '@/public/data/rolling/DLTR_rolling.json'
import docData        from '@/public/data/rolling/DOC_rolling.json'
import dovData        from '@/public/data/rolling/DOV_rolling.json'
import dpzData        from '@/public/data/rolling/DPZ_rolling.json'
import driData        from '@/public/data/rolling/DRI_rolling.json'
import dteData        from '@/public/data/rolling/DTE_rolling.json'
import dukData        from '@/public/data/rolling/DUK_rolling.json'
import dvaData        from '@/public/data/rolling/DVA_rolling.json'
import dvnData        from '@/public/data/rolling/DVN_rolling.json'
import dxcmData       from '@/public/data/rolling/DXCM_rolling.json'
import ebayData       from '@/public/data/rolling/EBAY_rolling.json'
import eclData        from '@/public/data/rolling/ECL_rolling.json'
import edData         from '@/public/data/rolling/ED_rolling.json'
import efxData        from '@/public/data/rolling/EFX_rolling.json'
import egData         from '@/public/data/rolling/EG_rolling.json'
import eixData        from '@/public/data/rolling/EIX_rolling.json'
import elData         from '@/public/data/rolling/EL_rolling.json'
import elvData        from '@/public/data/rolling/ELV_rolling.json'
import emeData        from '@/public/data/rolling/EME_rolling.json'
import emrData        from '@/public/data/rolling/EMR_rolling.json'
import eogData        from '@/public/data/rolling/EOG_rolling.json'
import eqixData       from '@/public/data/rolling/EQIX_rolling.json'
import eqtData        from '@/public/data/rolling/EQT_rolling.json'
import erieData       from '@/public/data/rolling/ERIE_rolling.json'
import esData         from '@/public/data/rolling/ES_rolling.json'
import essData        from '@/public/data/rolling/ESS_rolling.json'
import etnData        from '@/public/data/rolling/ETN_rolling.json'
import etrData        from '@/public/data/rolling/ETR_rolling.json'
import ewData         from '@/public/data/rolling/EW_rolling.json'
import excData        from '@/public/data/rolling/EXC_rolling.json'
import expdData       from '@/public/data/rolling/EXPD_rolling.json'
import expeData       from '@/public/data/rolling/EXPE_rolling.json'
import exrData        from '@/public/data/rolling/EXR_rolling.json'
import fData          from '@/public/data/rolling/F_rolling.json'
import fangData       from '@/public/data/rolling/FANG_rolling.json'
import fastData       from '@/public/data/rolling/FAST_rolling.json'
import fcxData        from '@/public/data/rolling/FCX_rolling.json'
import fdsData        from '@/public/data/rolling/FDS_rolling.json'
import fdxData        from '@/public/data/rolling/FDX_rolling.json'
import feData         from '@/public/data/rolling/FE_rolling.json'
import ffivData       from '@/public/data/rolling/FFIV_rolling.json'
import ficoData       from '@/public/data/rolling/FICO_rolling.json'
import fisData        from '@/public/data/rolling/FIS_rolling.json'
import fisvData       from '@/public/data/rolling/FISV_rolling.json'
import fitbData       from '@/public/data/rolling/FITB_rolling.json'
import fixData        from '@/public/data/rolling/FIX_rolling.json'
import flexData       from '@/public/data/rolling/FLEX_rolling.json'
import frtData        from '@/public/data/rolling/FRT_rolling.json'
import fslrData       from '@/public/data/rolling/FSLR_rolling.json'
import ftntData       from '@/public/data/rolling/FTNT_rolling.json'
import gdData         from '@/public/data/rolling/GD_rolling.json'
import gddyData       from '@/public/data/rolling/GDDY_rolling.json'
import geData         from '@/public/data/rolling/GE_rolling.json'
import genData        from '@/public/data/rolling/GEN_rolling.json'
import gildData       from '@/public/data/rolling/GILD_rolling.json'
import gisData        from '@/public/data/rolling/GIS_rolling.json'
import glData         from '@/public/data/rolling/GL_rolling.json'
import glwData        from '@/public/data/rolling/GLW_rolling.json'
import gmData         from '@/public/data/rolling/GM_rolling.json'
import gnrcData       from '@/public/data/rolling/GNRC_rolling.json'
import googlData      from '@/public/data/rolling/GOOGL_rolling.json'
import gpcData        from '@/public/data/rolling/GPC_rolling.json'
import gpnData        from '@/public/data/rolling/GPN_rolling.json'
import grmnData       from '@/public/data/rolling/GRMN_rolling.json'
import gsData         from '@/public/data/rolling/GS_rolling.json'
import gwwData        from '@/public/data/rolling/GWW_rolling.json'
import halData        from '@/public/data/rolling/HAL_rolling.json'
import hasData        from '@/public/data/rolling/HAS_rolling.json'
import hbanData       from '@/public/data/rolling/HBAN_rolling.json'
import hcaData        from '@/public/data/rolling/HCA_rolling.json'
import hdData         from '@/public/data/rolling/HD_rolling.json'
import higData        from '@/public/data/rolling/HIG_rolling.json'
import hiiData        from '@/public/data/rolling/HII_rolling.json'
import hltData        from '@/public/data/rolling/HLT_rolling.json'
import honData        from '@/public/data/rolling/HON_rolling.json'
import hpeData        from '@/public/data/rolling/HPE_rolling.json'
import hpqData        from '@/public/data/rolling/HPQ_rolling.json'
import hrlData        from '@/public/data/rolling/HRL_rolling.json'
import hsicData       from '@/public/data/rolling/HSIC_rolling.json'
import hstData        from '@/public/data/rolling/HST_rolling.json'
import hsyData        from '@/public/data/rolling/HSY_rolling.json'
import hubbData       from '@/public/data/rolling/HUBB_rolling.json'
import humData        from '@/public/data/rolling/HUM_rolling.json'
import ibkrData       from '@/public/data/rolling/IBKR_rolling.json'
import ibmData        from '@/public/data/rolling/IBM_rolling.json'
import iceData        from '@/public/data/rolling/ICE_rolling.json'
import idxxData       from '@/public/data/rolling/IDXX_rolling.json'
import iexData        from '@/public/data/rolling/IEX_rolling.json'
import iffData        from '@/public/data/rolling/IFF_rolling.json'
import ilmnData       from '@/public/data/rolling/ILMN_rolling.json'
import incyData       from '@/public/data/rolling/INCY_rolling.json'
import intcData       from '@/public/data/rolling/INTC_rolling.json'
import intuData       from '@/public/data/rolling/INTU_rolling.json'
import ipData         from '@/public/data/rolling/IP_rolling.json'
import irmData        from '@/public/data/rolling/IRM_rolling.json'
import isrgData       from '@/public/data/rolling/ISRG_rolling.json'
import itData         from '@/public/data/rolling/IT_rolling.json'
import itwData        from '@/public/data/rolling/ITW_rolling.json'
import ivzData        from '@/public/data/rolling/IVZ_rolling.json'
import jData          from '@/public/data/rolling/J_rolling.json'
import jbhtData       from '@/public/data/rolling/JBHT_rolling.json'
import jblData        from '@/public/data/rolling/JBL_rolling.json'
import jciData        from '@/public/data/rolling/JCI_rolling.json'
import jkhyData       from '@/public/data/rolling/JKHY_rolling.json'
import jnjData        from '@/public/data/rolling/JNJ_rolling.json'
import jpmData        from '@/public/data/rolling/JPM_rolling.json'
import keyData        from '@/public/data/rolling/KEY_rolling.json'
import keysData       from '@/public/data/rolling/KEYS_rolling.json'
import khcData        from '@/public/data/rolling/KHC_rolling.json'
import kimData        from '@/public/data/rolling/KIM_rolling.json'
import kkrData        from '@/public/data/rolling/KKR_rolling.json'
import klacData       from '@/public/data/rolling/KLAC_rolling.json'
import kmbData        from '@/public/data/rolling/KMB_rolling.json'
import kmiData        from '@/public/data/rolling/KMI_rolling.json'
import koData         from '@/public/data/rolling/KO_rolling.json'
import krData         from '@/public/data/rolling/KR_rolling.json'
import lData          from '@/public/data/rolling/L_rolling.json'
import ldosData       from '@/public/data/rolling/LDOS_rolling.json'
import lenData        from '@/public/data/rolling/LEN_rolling.json'
import lhData         from '@/public/data/rolling/LH_rolling.json'
import liiData        from '@/public/data/rolling/LII_rolling.json'
import liteData       from '@/public/data/rolling/LITE_rolling.json'
import llyData        from '@/public/data/rolling/LLY_rolling.json'
import lmtData        from '@/public/data/rolling/LMT_rolling.json'
import lntData        from '@/public/data/rolling/LNT_rolling.json'
import lowData        from '@/public/data/rolling/LOW_rolling.json'
import lrcxData       from '@/public/data/rolling/LRCX_rolling.json'
import luluData       from '@/public/data/rolling/LULU_rolling.json'
import luvData        from '@/public/data/rolling/LUV_rolling.json'
import lvsData        from '@/public/data/rolling/LVS_rolling.json'
import lybData        from '@/public/data/rolling/LYB_rolling.json'
import lyvData        from '@/public/data/rolling/LYV_rolling.json'
import maData         from '@/public/data/rolling/MA_rolling.json'
import maaData        from '@/public/data/rolling/MAA_rolling.json'
import marData        from '@/public/data/rolling/MAR_rolling.json'
import masData        from '@/public/data/rolling/MAS_rolling.json'
import mcdData        from '@/public/data/rolling/MCD_rolling.json'
import mchpData       from '@/public/data/rolling/MCHP_rolling.json'
import mckData        from '@/public/data/rolling/MCK_rolling.json'
import mcoData        from '@/public/data/rolling/MCO_rolling.json'
import mdlzData       from '@/public/data/rolling/MDLZ_rolling.json'
import mdtData        from '@/public/data/rolling/MDT_rolling.json'
import metData        from '@/public/data/rolling/MET_rolling.json'
import metaData       from '@/public/data/rolling/META_rolling.json'
import mgmData        from '@/public/data/rolling/MGM_rolling.json'
import mkcData        from '@/public/data/rolling/MKC_rolling.json'
import mlmData        from '@/public/data/rolling/MLM_rolling.json'
import mmmData        from '@/public/data/rolling/MMM_rolling.json'
import mnstData       from '@/public/data/rolling/MNST_rolling.json'
import moData         from '@/public/data/rolling/MO_rolling.json'
import mosData        from '@/public/data/rolling/MOS_rolling.json'
import mpcData        from '@/public/data/rolling/MPC_rolling.json'
import mpwrData       from '@/public/data/rolling/MPWR_rolling.json'
import mrkData        from '@/public/data/rolling/MRK_rolling.json'
import mrvlData       from '@/public/data/rolling/MRVL_rolling.json'
import msData         from '@/public/data/rolling/MS_rolling.json'
import msciData       from '@/public/data/rolling/MSCI_rolling.json'
import msftData       from '@/public/data/rolling/MSFT_rolling.json'
import msiData        from '@/public/data/rolling/MSI_rolling.json'
import mtbData        from '@/public/data/rolling/MTB_rolling.json'
import mtdData        from '@/public/data/rolling/MTD_rolling.json'
import muData         from '@/public/data/rolling/MU_rolling.json'
import nclhData       from '@/public/data/rolling/NCLH_rolling.json'
import ndaqData       from '@/public/data/rolling/NDAQ_rolling.json'
import ndsnData       from '@/public/data/rolling/NDSN_rolling.json'
import neeData        from '@/public/data/rolling/NEE_rolling.json'
import nemData        from '@/public/data/rolling/NEM_rolling.json'
import nflxData       from '@/public/data/rolling/NFLX_rolling.json'
import niData         from '@/public/data/rolling/NI_rolling.json'
import nkeData        from '@/public/data/rolling/NKE_rolling.json'
import nkeDiv         from '@/public/data/rolling/NKE_dividend.json'
import nocData        from '@/public/data/rolling/NOC_rolling.json'
import nowData        from '@/public/data/rolling/NOW_rolling.json'
import nrgData        from '@/public/data/rolling/NRG_rolling.json'
import nscData        from '@/public/data/rolling/NSC_rolling.json'
import ntapData       from '@/public/data/rolling/NTAP_rolling.json'
import ntrsData       from '@/public/data/rolling/NTRS_rolling.json'
import nueData        from '@/public/data/rolling/NUE_rolling.json'
import nvdaData       from '@/public/data/rolling/NVDA_rolling.json'
import nvrData        from '@/public/data/rolling/NVR_rolling.json'
import nwsData        from '@/public/data/rolling/NWS_rolling.json'
import nwsaData       from '@/public/data/rolling/NWSA_rolling.json'
import nxpiData       from '@/public/data/rolling/NXPI_rolling.json'
import oData          from '@/public/data/rolling/O_rolling.json'
import odflData       from '@/public/data/rolling/ODFL_rolling.json'
import okeData        from '@/public/data/rolling/OKE_rolling.json'
import omcData        from '@/public/data/rolling/OMC_rolling.json'
import onData         from '@/public/data/rolling/ON_rolling.json'
import orclData       from '@/public/data/rolling/ORCL_rolling.json'
import orlyData       from '@/public/data/rolling/ORLY_rolling.json'
import oxyData        from '@/public/data/rolling/OXY_rolling.json'
import panwData       from '@/public/data/rolling/PANW_rolling.json'
import payxData       from '@/public/data/rolling/PAYX_rolling.json'
import pcarData       from '@/public/data/rolling/PCAR_rolling.json'
import pcgData        from '@/public/data/rolling/PCG_rolling.json'
import pegData        from '@/public/data/rolling/PEG_rolling.json'
import pepData        from '@/public/data/rolling/PEP_rolling.json'
import pfeData        from '@/public/data/rolling/PFE_rolling.json'
import pfgData        from '@/public/data/rolling/PFG_rolling.json'
import pgData         from '@/public/data/rolling/PG_rolling.json'
import pgrData        from '@/public/data/rolling/PGR_rolling.json'
import phData         from '@/public/data/rolling/PH_rolling.json'
import phmData        from '@/public/data/rolling/PHM_rolling.json'
import pkgData        from '@/public/data/rolling/PKG_rolling.json'
import pldData        from '@/public/data/rolling/PLD_rolling.json'
import pmData         from '@/public/data/rolling/PM_rolling.json'
import pncData        from '@/public/data/rolling/PNC_rolling.json'
import pnrData        from '@/public/data/rolling/PNR_rolling.json'
import pnwData        from '@/public/data/rolling/PNW_rolling.json'
import poddData       from '@/public/data/rolling/PODD_rolling.json'
import ppgData        from '@/public/data/rolling/PPG_rolling.json'
import pplData        from '@/public/data/rolling/PPL_rolling.json'
import pruData        from '@/public/data/rolling/PRU_rolling.json'
import psaData        from '@/public/data/rolling/PSA_rolling.json'
import psxData        from '@/public/data/rolling/PSX_rolling.json'
import ptcData        from '@/public/data/rolling/PTC_rolling.json'
import pwrData        from '@/public/data/rolling/PWR_rolling.json'
import pyplData       from '@/public/data/rolling/PYPL_rolling.json'
import qcomData       from '@/public/data/rolling/QCOM_rolling.json'
import rclData        from '@/public/data/rolling/RCL_rolling.json'
import regData        from '@/public/data/rolling/REG_rolling.json'
import regnData       from '@/public/data/rolling/REGN_rolling.json'
import rfData         from '@/public/data/rolling/RF_rolling.json'
import rjfData        from '@/public/data/rolling/RJF_rolling.json'
import rlData         from '@/public/data/rolling/RL_rolling.json'
import rmdData        from '@/public/data/rolling/RMD_rolling.json'
import rmsData        from '@/public/data/rolling/RMS_rolling.json'
import rmsDiv         from '@/public/data/rolling/RMS_dividend.json'
import rokData        from '@/public/data/rolling/ROK_rolling.json'
import rolData        from '@/public/data/rolling/ROL_rolling.json'
import ropData        from '@/public/data/rolling/ROP_rolling.json'
import rostData       from '@/public/data/rolling/ROST_rolling.json'
import rsgData        from '@/public/data/rolling/RSG_rolling.json'
import rvtyData       from '@/public/data/rolling/RVTY_rolling.json'
import sbacData       from '@/public/data/rolling/SBAC_rolling.json'
import sbuxData       from '@/public/data/rolling/SBUX_rolling.json'
import schwData       from '@/public/data/rolling/SCHW_rolling.json'
import shwData        from '@/public/data/rolling/SHW_rolling.json'
import sjmData        from '@/public/data/rolling/SJM_rolling.json'
import slbData        from '@/public/data/rolling/SLB_rolling.json'
import smciData       from '@/public/data/rolling/SMCI_rolling.json'
import snaData        from '@/public/data/rolling/SNA_rolling.json'
import snpsData       from '@/public/data/rolling/SNPS_rolling.json'
import soData         from '@/public/data/rolling/SO_rolling.json'
import spgData        from '@/public/data/rolling/SPG_rolling.json'
import spgiData       from '@/public/data/rolling/SPGI_rolling.json'
import sreData        from '@/public/data/rolling/SRE_rolling.json'
import steData        from '@/public/data/rolling/STE_rolling.json'
import stldData       from '@/public/data/rolling/STLD_rolling.json'
import sttData        from '@/public/data/rolling/STT_rolling.json'
import stxData        from '@/public/data/rolling/STX_rolling.json'
import stzData        from '@/public/data/rolling/STZ_rolling.json'
import swkData        from '@/public/data/rolling/SWK_rolling.json'
import swksData       from '@/public/data/rolling/SWKS_rolling.json'
import syfData        from '@/public/data/rolling/SYF_rolling.json'
import sykData        from '@/public/data/rolling/SYK_rolling.json'
import syyData        from '@/public/data/rolling/SYY_rolling.json'
import tData          from '@/public/data/rolling/T_rolling.json'
import tdgData        from '@/public/data/rolling/TDG_rolling.json'
import tdyData        from '@/public/data/rolling/TDY_rolling.json'
import techData       from '@/public/data/rolling/TECH_rolling.json'
import telData        from '@/public/data/rolling/TEL_rolling.json'
import terData        from '@/public/data/rolling/TER_rolling.json'
import tgtData        from '@/public/data/rolling/TGT_rolling.json'
import tjxData        from '@/public/data/rolling/TJX_rolling.json'
import tmoData        from '@/public/data/rolling/TMO_rolling.json'
import tmusData       from '@/public/data/rolling/TMUS_rolling.json'
import tplData        from '@/public/data/rolling/TPL_rolling.json'
import tprData        from '@/public/data/rolling/TPR_rolling.json'
import trgpData       from '@/public/data/rolling/TRGP_rolling.json'
import trmbData       from '@/public/data/rolling/TRMB_rolling.json'
import trowData       from '@/public/data/rolling/TROW_rolling.json'
import trvData        from '@/public/data/rolling/TRV_rolling.json'
import tscoData       from '@/public/data/rolling/TSCO_rolling.json'
import tslaData       from '@/public/data/rolling/TSLA_rolling.json'
import tsnData        from '@/public/data/rolling/TSN_rolling.json'
import ttData         from '@/public/data/rolling/TT_rolling.json'
import ttwoData       from '@/public/data/rolling/TTWO_rolling.json'
import txnData        from '@/public/data/rolling/TXN_rolling.json'
import txtData        from '@/public/data/rolling/TXT_rolling.json'
import tylData        from '@/public/data/rolling/TYL_rolling.json'
import ualData        from '@/public/data/rolling/UAL_rolling.json'
import udrData        from '@/public/data/rolling/UDR_rolling.json'
import uhsData        from '@/public/data/rolling/UHS_rolling.json'
import ultaData       from '@/public/data/rolling/ULTA_rolling.json'
import unhData        from '@/public/data/rolling/UNH_rolling.json'
import unpData        from '@/public/data/rolling/UNP_rolling.json'
import upsData        from '@/public/data/rolling/UPS_rolling.json'
import uriData        from '@/public/data/rolling/URI_rolling.json'
import usbData        from '@/public/data/rolling/USB_rolling.json'
import vData          from '@/public/data/rolling/V_rolling.json'
import veevData       from '@/public/data/rolling/VEEV_rolling.json'
import vloData        from '@/public/data/rolling/VLO_rolling.json'
import vmcData        from '@/public/data/rolling/VMC_rolling.json'
import vrskData       from '@/public/data/rolling/VRSK_rolling.json'
import vrsnData       from '@/public/data/rolling/VRSN_rolling.json'
import vrtxData       from '@/public/data/rolling/VRTX_rolling.json'
import vtrData        from '@/public/data/rolling/VTR_rolling.json'
import vzData         from '@/public/data/rolling/VZ_rolling.json'
import wabData        from '@/public/data/rolling/WAB_rolling.json'
import watData        from '@/public/data/rolling/WAT_rolling.json'
import wdayData       from '@/public/data/rolling/WDAY_rolling.json'
import wdcData        from '@/public/data/rolling/WDC_rolling.json'
import wecData        from '@/public/data/rolling/WEC_rolling.json'
import wellData       from '@/public/data/rolling/WELL_rolling.json'
import wfcData        from '@/public/data/rolling/WFC_rolling.json'
import wmData         from '@/public/data/rolling/WM_rolling.json'
import wmbData        from '@/public/data/rolling/WMB_rolling.json'
import wmtData        from '@/public/data/rolling/WMT_rolling.json'
import wrbData        from '@/public/data/rolling/WRB_rolling.json'
import wsmData        from '@/public/data/rolling/WSM_rolling.json'
import wstData        from '@/public/data/rolling/WST_rolling.json'
import wtwData        from '@/public/data/rolling/WTW_rolling.json'
import wyData         from '@/public/data/rolling/WY_rolling.json'
import wynnData       from '@/public/data/rolling/WYNN_rolling.json'
import xelData        from '@/public/data/rolling/XEL_rolling.json'
import xomData        from '@/public/data/rolling/XOM_rolling.json'
import xylData        from '@/public/data/rolling/XYL_rolling.json'
import yumData        from '@/public/data/rolling/YUM_rolling.json'
import zbhData        from '@/public/data/rolling/ZBH_rolling.json'
import zbraData       from '@/public/data/rolling/ZBRA_rolling.json'
import ztsData        from '@/public/data/rolling/ZTS_rolling.json'
import vstData        from '@/public/data/rolling/VST_rolling.json'
import hwmData        from '@/public/data/rolling/HWM_rolling.json'
import beData         from '@/public/data/rolling/BE_rolling.json'
import exeData        from '@/public/data/rolling/EXE_rolling.json'
import ftvData        from '@/public/data/rolling/FTV_rolling.json'
import twloData       from '@/public/data/rolling/TWLO_rolling.json'

ChartJS.register(CategoryScale, LinearScale, LogarithmicScale, BarElement, LineElement, PointElement, Filler, Tooltip, Legend)

type StockData = typeof nkeData

const STOCKS: Array<{ key: string; data: StockData }> = [
  { key: 'QLD',      data: qldData        as unknown as unknown as StockData },
  { key: 'QQQ',      data: qqqData        as unknown as unknown as StockData },
  { key: 'TQQQ',     data: tqqqData       as unknown as unknown as StockData },
  { key: 'A',        data: aData          as unknown as StockData },
  { key: 'AAPL',     data: aaplData       as unknown as StockData },
  { key: 'ABBV',     data: abbvData       as unknown as StockData },
  { key: 'ABT',      data: abtData        as unknown as StockData },
  { key: 'ACGL',     data: acglData       as unknown as StockData },
  { key: 'ACN',      data: acnData        as unknown as StockData },
  { key: 'ADBE',     data: adbeData       as unknown as StockData },
  { key: 'ADI',      data: adiData        as unknown as StockData },
  { key: 'ADM',      data: admData        as unknown as StockData },
  { key: 'ADP',      data: adpData        as unknown as StockData },
  { key: 'ADSK',     data: adskData       as unknown as StockData },
  { key: 'AEE',      data: aeeData        as unknown as StockData },
  { key: 'AEP',      data: aepData        as unknown as StockData },
  { key: 'AES',      data: aesData        as unknown as StockData },
  { key: 'AFL',      data: aflData        as unknown as StockData },
  { key: 'AIG',      data: aigData        as unknown as StockData },
  { key: 'AIZ',      data: aizData        as unknown as StockData },
  { key: 'AJG',      data: ajgData        as unknown as StockData },
  { key: 'AKAM',     data: akamData       as unknown as StockData },
  { key: 'ALB',      data: albData        as unknown as StockData },
  { key: 'ALGN',     data: algnData       as unknown as StockData },
  { key: 'ALL',      data: allData        as unknown as StockData },
  { key: 'ALLE',     data: alleData       as unknown as StockData },
  { key: 'AMAT',     data: amatData       as unknown as StockData },
  { key: 'AMCR',     data: amcrData       as unknown as StockData },
  { key: 'AMD',      data: amdData        as unknown as StockData },
  { key: 'AME',      data: ameData        as unknown as StockData },
  { key: 'AMGN',     data: amgnData       as unknown as StockData },
  { key: 'AMP',      data: ampData        as unknown as StockData },
  { key: 'AMT',      data: amtData        as unknown as StockData },
  { key: 'AMZN',     data: amznData       as unknown as StockData },
  { key: 'ANET',     data: anetData       as unknown as StockData },
  { key: 'AON',      data: aonData        as unknown as StockData },
  { key: 'AOS',      data: aosData        as unknown as StockData },
  { key: 'APA',      data: apaData        as unknown as StockData },
  { key: 'APD',      data: apdData        as unknown as StockData },
  { key: 'APH',      data: aphData        as unknown as StockData },
  { key: 'APO',      data: apoData        as unknown as StockData },
  { key: 'APTV',     data: aptvData       as unknown as StockData },
  { key: 'ARE',      data: areData        as unknown as StockData },
  { key: 'ARES',     data: aresData       as unknown as StockData },
  { key: 'ATO',      data: atoData        as unknown as StockData },
  { key: 'AVGO',     data: avgoData       as unknown as StockData },
  { key: 'AVY',      data: avyData        as unknown as StockData },
  { key: 'AWK',      data: awkData        as unknown as StockData },
  { key: 'AXON',     data: axonData       as unknown as StockData },
  { key: 'AXP',      data: axpData        as unknown as StockData },
  { key: 'AZO',      data: azoData        as unknown as StockData },
  { key: 'BA',       data: baData         as unknown as StockData },
  { key: 'BAC',      data: bacData        as unknown as StockData },
  { key: 'BALL',     data: ballData       as unknown as StockData },
  { key: 'BAX',      data: baxData        as unknown as StockData },
  { key: 'BBY',      data: bbyData        as unknown as StockData },
  { key: 'BDX',      data: bdxData        as unknown as StockData },
  { key: 'BEN',      data: benData        as unknown as StockData },
  { key: 'BF-B',     data: bfbData        as unknown as StockData },
  { key: 'BG',       data: bgData         as unknown as StockData },
  { key: 'BIIB',     data: biibData       as unknown as StockData },
  { key: 'BKNG',     data: bkngData       as unknown as StockData },
  { key: 'BKR',      data: bkrData        as unknown as StockData },
  { key: 'BLK',      data: blkData        as unknown as StockData },
  { key: 'BMY',      data: bmyData        as unknown as StockData },
  { key: 'BNY',      data: bnyData        as unknown as StockData },
  { key: 'BR',       data: brData         as unknown as StockData },
  { key: 'BRK-B',    data: brkbData       as unknown as StockData },
  { key: 'BRO',      data: broData        as unknown as StockData },
  { key: 'BSX',      data: bsxData        as unknown as StockData },
  { key: 'BX',       data: bxData         as unknown as StockData },
  { key: 'BXP',      data: bxpData        as unknown as StockData },
  { key: 'C',        data: cData          as unknown as StockData },
  { key: 'CAH',      data: cahData        as unknown as StockData },
  { key: 'CASY',     data: casyData       as unknown as StockData },
  { key: 'CAT',      data: catData        as unknown as StockData },
  { key: 'CB',       data: cbData         as unknown as StockData },
  { key: 'CBOE',     data: cboeData       as unknown as StockData },
  { key: 'CBRE',     data: cbreData       as unknown as StockData },
  { key: 'CCI',      data: cciData        as unknown as StockData },
  { key: 'CCL',      data: cclData        as unknown as StockData },
  { key: 'CDNS',     data: cdnsData       as unknown as StockData },
  { key: 'CDW',      data: cdwData        as unknown as StockData },
  { key: 'CF',       data: cfData         as unknown as StockData },
  { key: 'CFG',      data: cfgData        as unknown as StockData },
  { key: 'CHD',      data: chdData        as unknown as StockData },
  { key: 'CHRW',     data: chrwData       as unknown as StockData },
  { key: 'CHTR',     data: chtrData       as unknown as StockData },
  { key: 'CI',       data: ciData         as unknown as StockData },
  { key: 'CIEN',     data: cienData       as unknown as StockData },
  { key: 'CINF',     data: cinfData       as unknown as StockData },
  { key: 'CL',       data: clData         as unknown as StockData },
  { key: 'CLX',      data: clxData        as unknown as StockData },
  { key: 'CMCSA',    data: cmcsaData      as unknown as StockData },
  { key: 'CME',      data: cmeData        as unknown as StockData },
  { key: 'CMG',      data: cmgData        as unknown as StockData },
  { key: 'CMI',      data: cmiData        as unknown as StockData },
  { key: 'CMS',      data: cmsData        as unknown as StockData },
  { key: 'CNC',      data: cncData        as unknown as StockData },
  { key: 'CNP',      data: cnpData        as unknown as StockData },
  { key: 'COF',      data: cofData        as unknown as StockData },
  { key: 'COO',      data: cooData        as unknown as StockData },
  { key: 'COP',      data: copData        as unknown as StockData },
  { key: 'COR',      data: corData        as unknown as StockData },
  { key: 'COST',     data: costData       as unknown as StockData },
  { key: 'CPAY',     data: cpayData       as unknown as StockData },
  { key: 'CPRT',     data: cprtData       as unknown as StockData },
  { key: 'CPT',      data: cptData        as unknown as StockData },
  { key: 'CRL',      data: crlData        as unknown as StockData },
  { key: 'CRM',      data: crmData        as unknown as StockData },
  { key: 'CSCO',     data: cscoData       as unknown as StockData },
  { key: 'CSGP',     data: csgpData       as unknown as StockData },
  { key: 'CSX',      data: csxData        as unknown as StockData },
  { key: 'CTAS',     data: ctasData       as unknown as StockData },
  { key: 'CTSH',     data: ctshData       as unknown as StockData },
  { key: 'CVS',      data: cvsData        as unknown as StockData },
  { key: 'CVX',      data: cvxData        as unknown as StockData },
  { key: 'D',        data: dData          as unknown as StockData },
  { key: 'DAL',      data: dalData        as unknown as StockData },
  { key: 'DD',       data: ddData         as unknown as StockData },
  { key: 'DE',       data: deData         as unknown as StockData },
  { key: 'DECK',     data: deckData       as unknown as StockData },
  { key: 'DG',       data: dgData         as unknown as StockData },
  { key: 'DGX',      data: dgxData        as unknown as StockData },
  { key: 'DHI',      data: dhiData        as unknown as StockData },
  { key: 'DHR',      data: dhrData        as unknown as StockData },
  { key: 'DIS',      data: disData        as unknown as StockData },
  { key: 'DLR',      data: dlrData        as unknown as StockData },
  { key: 'DLTR',     data: dltrData       as unknown as StockData },
  { key: 'DOC',      data: docData        as unknown as StockData },
  { key: 'DOV',      data: dovData        as unknown as StockData },
  { key: 'DPZ',      data: dpzData        as unknown as StockData },
  { key: 'DRI',      data: driData        as unknown as StockData },
  { key: 'DTE',      data: dteData        as unknown as StockData },
  { key: 'DUK',      data: dukData        as unknown as StockData },
  { key: 'DVA',      data: dvaData        as unknown as StockData },
  { key: 'DVN',      data: dvnData        as unknown as StockData },
  { key: 'DXCM',     data: dxcmData       as unknown as StockData },
  { key: 'EBAY',     data: ebayData       as unknown as StockData },
  { key: 'ECL',      data: eclData        as unknown as StockData },
  { key: 'ED',       data: edData         as unknown as StockData },
  { key: 'EFX',      data: efxData        as unknown as StockData },
  { key: 'EG',       data: egData         as unknown as StockData },
  { key: 'EIX',      data: eixData        as unknown as StockData },
  { key: 'EL',       data: elData         as unknown as StockData },
  { key: 'ELV',      data: elvData        as unknown as StockData },
  { key: 'EME',      data: emeData        as unknown as StockData },
  { key: 'EMR',      data: emrData        as unknown as StockData },
  { key: 'EOG',      data: eogData        as unknown as StockData },
  { key: 'EQIX',     data: eqixData       as unknown as StockData },
  { key: 'EQT',      data: eqtData        as unknown as StockData },
  { key: 'ERIE',     data: erieData       as unknown as StockData },
  { key: 'ES',       data: esData         as unknown as StockData },
  { key: 'ESS',      data: essData        as unknown as StockData },
  { key: 'ETN',      data: etnData        as unknown as StockData },
  { key: 'ETR',      data: etrData        as unknown as StockData },
  { key: 'EW',       data: ewData         as unknown as StockData },
  { key: 'EXC',      data: excData        as unknown as StockData },
  { key: 'EXPD',     data: expdData       as unknown as StockData },
  { key: 'EXPE',     data: expeData       as unknown as StockData },
  { key: 'EXR',      data: exrData        as unknown as StockData },
  { key: 'F',        data: fData          as unknown as StockData },
  { key: 'FANG',     data: fangData       as unknown as StockData },
  { key: 'FAST',     data: fastData       as unknown as StockData },
  { key: 'FCX',      data: fcxData        as unknown as StockData },
  { key: 'FDS',      data: fdsData        as unknown as StockData },
  { key: 'FDX',      data: fdxData        as unknown as StockData },
  { key: 'FE',       data: feData         as unknown as StockData },
  { key: 'FFIV',     data: ffivData       as unknown as StockData },
  { key: 'FICO',     data: ficoData       as unknown as StockData },
  { key: 'FIS',      data: fisData        as unknown as StockData },
  { key: 'FISV',     data: fisvData       as unknown as StockData },
  { key: 'FITB',     data: fitbData       as unknown as StockData },
  { key: 'FIX',      data: fixData        as unknown as StockData },
  { key: 'FLEX',     data: flexData       as unknown as StockData },
  { key: 'FRT',      data: frtData        as unknown as StockData },
  { key: 'FSLR',     data: fslrData       as unknown as StockData },
  { key: 'FTNT',     data: ftntData       as unknown as StockData },
  { key: 'GD',       data: gdData         as unknown as StockData },
  { key: 'GDDY',     data: gddyData       as unknown as StockData },
  { key: 'GE',       data: geData         as unknown as StockData },
  { key: 'GEN',      data: genData        as unknown as StockData },
  { key: 'GILD',     data: gildData       as unknown as StockData },
  { key: 'GIS',      data: gisData        as unknown as StockData },
  { key: 'GL',       data: glData         as unknown as StockData },
  { key: 'GLW',      data: glwData        as unknown as StockData },
  { key: 'GM',       data: gmData         as unknown as StockData },
  { key: 'GNRC',     data: gnrcData       as unknown as StockData },
  { key: 'GOOGL',    data: googlData      as unknown as StockData },
  { key: 'GPC',      data: gpcData        as unknown as StockData },
  { key: 'GPN',      data: gpnData        as unknown as StockData },
  { key: 'GRMN',     data: grmnData       as unknown as StockData },
  { key: 'GS',       data: gsData         as unknown as StockData },
  { key: 'GWW',      data: gwwData        as unknown as StockData },
  { key: 'HAL',      data: halData        as unknown as StockData },
  { key: 'HAS',      data: hasData        as unknown as StockData },
  { key: 'HBAN',     data: hbanData       as unknown as StockData },
  { key: 'HCA',      data: hcaData        as unknown as StockData },
  { key: 'HD',       data: hdData         as unknown as StockData },
  { key: 'HIG',      data: higData        as unknown as StockData },
  { key: 'HII',      data: hiiData        as unknown as StockData },
  { key: 'HLT',      data: hltData        as unknown as StockData },
  { key: 'HON',      data: honData        as unknown as StockData },
  { key: 'HPE',      data: hpeData        as unknown as StockData },
  { key: 'HPQ',      data: hpqData        as unknown as StockData },
  { key: 'HRL',      data: hrlData        as unknown as StockData },
  { key: 'HSIC',     data: hsicData       as unknown as StockData },
  { key: 'HST',      data: hstData        as unknown as StockData },
  { key: 'HSY',      data: hsyData        as unknown as StockData },
  { key: 'HUBB',     data: hubbData       as unknown as StockData },
  { key: 'HUM',      data: humData        as unknown as StockData },
  { key: 'IBKR',     data: ibkrData       as unknown as StockData },
  { key: 'IBM',      data: ibmData        as unknown as StockData },
  { key: 'ICE',      data: iceData        as unknown as StockData },
  { key: 'IDXX',     data: idxxData       as unknown as StockData },
  { key: 'IEX',      data: iexData        as unknown as StockData },
  { key: 'IFF',      data: iffData        as unknown as StockData },
  { key: 'ILMN',     data: ilmnData       as unknown as StockData },
  { key: 'INCY',     data: incyData       as unknown as StockData },
  { key: 'INTC',     data: intcData       as unknown as StockData },
  { key: 'INTU',     data: intuData       as unknown as StockData },
  { key: 'IP',       data: ipData         as unknown as StockData },
  { key: 'IRM',      data: irmData        as unknown as StockData },
  { key: 'ISRG',     data: isrgData       as unknown as StockData },
  { key: 'IT',       data: itData         as unknown as StockData },
  { key: 'ITW',      data: itwData        as unknown as StockData },
  { key: 'IVZ',      data: ivzData        as unknown as StockData },
  { key: 'J',        data: jData          as unknown as StockData },
  { key: 'JBHT',     data: jbhtData       as unknown as StockData },
  { key: 'JBL',      data: jblData        as unknown as StockData },
  { key: 'JCI',      data: jciData        as unknown as StockData },
  { key: 'JKHY',     data: jkhyData       as unknown as StockData },
  { key: 'JNJ',      data: jnjData        as unknown as StockData },
  { key: 'JPM',      data: jpmData        as unknown as StockData },
  { key: 'KEY',      data: keyData        as unknown as StockData },
  { key: 'KEYS',     data: keysData       as unknown as StockData },
  { key: 'KHC',      data: khcData        as unknown as StockData },
  { key: 'KIM',      data: kimData        as unknown as StockData },
  { key: 'KKR',      data: kkrData        as unknown as StockData },
  { key: 'KLAC',     data: klacData       as unknown as StockData },
  { key: 'KMB',      data: kmbData        as unknown as StockData },
  { key: 'KMI',      data: kmiData        as unknown as StockData },
  { key: 'KO',       data: koData         as unknown as StockData },
  { key: 'KR',       data: krData         as unknown as StockData },
  { key: 'L',        data: lData          as unknown as StockData },
  { key: 'LDOS',     data: ldosData       as unknown as StockData },
  { key: 'LEN',      data: lenData        as unknown as StockData },
  { key: 'LH',       data: lhData         as unknown as StockData },
  { key: 'LII',      data: liiData        as unknown as StockData },
  { key: 'LITE',     data: liteData       as unknown as StockData },
  { key: 'LLY',      data: llyData        as unknown as StockData },
  { key: 'LMT',      data: lmtData        as unknown as StockData },
  { key: 'LNT',      data: lntData        as unknown as StockData },
  { key: 'LOW',      data: lowData        as unknown as StockData },
  { key: 'LRCX',     data: lrcxData       as unknown as StockData },
  { key: 'LULU',     data: luluData       as unknown as StockData },
  { key: 'LUV',      data: luvData        as unknown as StockData },
  { key: 'LVS',      data: lvsData        as unknown as StockData },
  { key: 'LYB',      data: lybData        as unknown as StockData },
  { key: 'LYV',      data: lyvData        as unknown as StockData },
  { key: 'MA',       data: maData         as unknown as StockData },
  { key: 'MAA',      data: maaData        as unknown as StockData },
  { key: 'MAR',      data: marData        as unknown as StockData },
  { key: 'MAS',      data: masData        as unknown as StockData },
  { key: 'MCD',      data: mcdData        as unknown as StockData },
  { key: 'MCHP',     data: mchpData       as unknown as StockData },
  { key: 'MCK',      data: mckData        as unknown as StockData },
  { key: 'MCO',      data: mcoData        as unknown as StockData },
  { key: 'MDLZ',     data: mdlzData       as unknown as StockData },
  { key: 'MDT',      data: mdtData        as unknown as StockData },
  { key: 'MET',      data: metData        as unknown as StockData },
  { key: 'META',     data: metaData       as unknown as StockData },
  { key: 'MGM',      data: mgmData        as unknown as StockData },
  { key: 'MKC',      data: mkcData        as unknown as StockData },
  { key: 'MLM',      data: mlmData        as unknown as StockData },
  { key: 'MMM',      data: mmmData        as unknown as StockData },
  { key: 'MNST',     data: mnstData       as unknown as StockData },
  { key: 'MO',       data: moData         as unknown as StockData },
  { key: 'MOS',      data: mosData        as unknown as StockData },
  { key: 'MPC',      data: mpcData        as unknown as StockData },
  { key: 'MPWR',     data: mpwrData       as unknown as StockData },
  { key: 'MRK',      data: mrkData        as unknown as StockData },
  { key: 'MRVL',     data: mrvlData       as unknown as StockData },
  { key: 'MS',       data: msData         as unknown as StockData },
  { key: 'MSCI',     data: msciData       as unknown as StockData },
  { key: 'MSFT',     data: msftData       as unknown as StockData },
  { key: 'MSI',      data: msiData        as unknown as StockData },
  { key: 'MTB',      data: mtbData        as unknown as StockData },
  { key: 'MTD',      data: mtdData        as unknown as StockData },
  { key: 'MU',       data: muData         as unknown as StockData },
  { key: 'NCLH',     data: nclhData       as unknown as StockData },
  { key: 'NDAQ',     data: ndaqData       as unknown as StockData },
  { key: 'NDSN',     data: ndsnData       as unknown as StockData },
  { key: 'NEE',      data: neeData        as unknown as StockData },
  { key: 'NEM',      data: nemData        as unknown as StockData },
  { key: 'NFLX',     data: nflxData       as unknown as StockData },
  { key: 'NI',       data: niData         as unknown as StockData },
  { key: 'NKE',      data: nkeData        as unknown as StockData },
  { key: 'NOC',      data: nocData        as unknown as StockData },
  { key: 'NOW',      data: nowData        as unknown as StockData },
  { key: 'NRG',      data: nrgData        as unknown as StockData },
  { key: 'NSC',      data: nscData        as unknown as StockData },
  { key: 'NTAP',     data: ntapData       as unknown as StockData },
  { key: 'NTRS',     data: ntrsData       as unknown as StockData },
  { key: 'NUE',      data: nueData        as unknown as StockData },
  { key: 'NVDA',     data: nvdaData       as unknown as StockData },
  { key: 'NVR',      data: nvrData        as unknown as StockData },
  { key: 'NWS',      data: nwsData        as unknown as StockData },
  { key: 'NWSA',     data: nwsaData       as unknown as StockData },
  { key: 'NXPI',     data: nxpiData       as unknown as StockData },
  { key: 'O',        data: oData          as unknown as StockData },
  { key: 'ODFL',     data: odflData       as unknown as StockData },
  { key: 'OKE',      data: okeData        as unknown as StockData },
  { key: 'OMC',      data: omcData        as unknown as StockData },
  { key: 'ON',       data: onData         as unknown as StockData },
  { key: 'ORCL',     data: orclData       as unknown as StockData },
  { key: 'ORLY',     data: orlyData       as unknown as StockData },
  { key: 'OXY',      data: oxyData        as unknown as StockData },
  { key: 'PANW',     data: panwData       as unknown as StockData },
  { key: 'PAYX',     data: payxData       as unknown as StockData },
  { key: 'PCAR',     data: pcarData       as unknown as StockData },
  { key: 'PCG',      data: pcgData        as unknown as StockData },
  { key: 'PEG',      data: pegData        as unknown as StockData },
  { key: 'PEP',      data: pepData        as unknown as StockData },
  { key: 'PFE',      data: pfeData        as unknown as StockData },
  { key: 'PFG',      data: pfgData        as unknown as StockData },
  { key: 'PG',       data: pgData         as unknown as StockData },
  { key: 'PGR',      data: pgrData        as unknown as StockData },
  { key: 'PH',       data: phData         as unknown as StockData },
  { key: 'PHM',      data: phmData        as unknown as StockData },
  { key: 'PKG',      data: pkgData        as unknown as StockData },
  { key: 'PLD',      data: pldData        as unknown as StockData },
  { key: 'PM',       data: pmData         as unknown as StockData },
  { key: 'PNC',      data: pncData        as unknown as StockData },
  { key: 'PNR',      data: pnrData        as unknown as StockData },
  { key: 'PNW',      data: pnwData        as unknown as StockData },
  { key: 'PODD',     data: poddData       as unknown as StockData },
  { key: 'PPG',      data: ppgData        as unknown as StockData },
  { key: 'PPL',      data: pplData        as unknown as StockData },
  { key: 'PRU',      data: pruData        as unknown as StockData },
  { key: 'PSA',      data: psaData        as unknown as StockData },
  { key: 'PSX',      data: psxData        as unknown as StockData },
  { key: 'PTC',      data: ptcData        as unknown as StockData },
  { key: 'PWR',      data: pwrData        as unknown as StockData },
  { key: 'PYPL',     data: pyplData       as unknown as StockData },
  { key: 'QCOM',     data: qcomData       as unknown as StockData },
  { key: 'RCL',      data: rclData        as unknown as StockData },
  { key: 'REG',      data: regData        as unknown as StockData },
  { key: 'REGN',     data: regnData       as unknown as StockData },
  { key: 'RF',       data: rfData         as unknown as StockData },
  { key: 'RJF',      data: rjfData        as unknown as StockData },
  { key: 'RL',       data: rlData         as unknown as StockData },
  { key: 'RMD',      data: rmdData        as unknown as StockData },
  { key: 'RMS',      data: rmsData        as unknown as StockData },
  { key: 'ROK',      data: rokData        as unknown as StockData },
  { key: 'ROL',      data: rolData        as unknown as StockData },
  { key: 'ROP',      data: ropData        as unknown as StockData },
  { key: 'ROST',     data: rostData       as unknown as StockData },
  { key: 'RSG',      data: rsgData        as unknown as StockData },
  { key: 'RVTY',     data: rvtyData       as unknown as StockData },
  { key: 'SBAC',     data: sbacData       as unknown as StockData },
  { key: 'SBUX',     data: sbuxData       as unknown as StockData },
  { key: 'SCHW',     data: schwData       as unknown as StockData },
  { key: 'SHW',      data: shwData        as unknown as StockData },
  { key: 'SJM',      data: sjmData        as unknown as StockData },
  { key: 'SLB',      data: slbData        as unknown as StockData },
  { key: 'SMCI',     data: smciData       as unknown as StockData },
  { key: 'SNA',      data: snaData        as unknown as StockData },
  { key: 'SNPS',     data: snpsData       as unknown as StockData },
  { key: 'SO',       data: soData         as unknown as StockData },
  { key: 'SPG',      data: spgData        as unknown as StockData },
  { key: 'SPGI',     data: spgiData       as unknown as StockData },
  { key: 'SRE',      data: sreData        as unknown as StockData },
  { key: 'STE',      data: steData        as unknown as StockData },
  { key: 'STLD',     data: stldData       as unknown as StockData },
  { key: 'STT',      data: sttData        as unknown as StockData },
  { key: 'STX',      data: stxData        as unknown as StockData },
  { key: 'STZ',      data: stzData        as unknown as StockData },
  { key: 'SWK',      data: swkData        as unknown as StockData },
  { key: 'SWKS',     data: swksData       as unknown as StockData },
  { key: 'SYF',      data: syfData        as unknown as StockData },
  { key: 'SYK',      data: sykData        as unknown as StockData },
  { key: 'SYY',      data: syyData        as unknown as StockData },
  { key: 'T',        data: tData          as unknown as StockData },
  { key: 'TDG',      data: tdgData        as unknown as StockData },
  { key: 'TDY',      data: tdyData        as unknown as StockData },
  { key: 'TECH',     data: techData       as unknown as StockData },
  { key: 'TEL',      data: telData        as unknown as StockData },
  { key: 'TER',      data: terData        as unknown as StockData },
  { key: 'TGT',      data: tgtData        as unknown as StockData },
  { key: 'TJX',      data: tjxData        as unknown as StockData },
  { key: 'TMO',      data: tmoData        as unknown as StockData },
  { key: 'TMUS',     data: tmusData       as unknown as StockData },
  { key: 'TPL',      data: tplData        as unknown as StockData },
  { key: 'TPR',      data: tprData        as unknown as StockData },
  { key: 'TRGP',     data: trgpData       as unknown as StockData },
  { key: 'TRMB',     data: trmbData       as unknown as StockData },
  { key: 'TROW',     data: trowData       as unknown as StockData },
  { key: 'TRV',      data: trvData        as unknown as StockData },
  { key: 'TSCO',     data: tscoData       as unknown as StockData },
  { key: 'TSLA',     data: tslaData       as unknown as StockData },
  { key: 'TSN',      data: tsnData        as unknown as StockData },
  { key: 'TT',       data: ttData         as unknown as StockData },
  { key: 'TTWO',     data: ttwoData       as unknown as StockData },
  { key: 'TXN',      data: txnData        as unknown as StockData },
  { key: 'TXT',      data: txtData        as unknown as StockData },
  { key: 'TYL',      data: tylData        as unknown as StockData },
  { key: 'UAL',      data: ualData        as unknown as StockData },
  { key: 'UDR',      data: udrData        as unknown as StockData },
  { key: 'UHS',      data: uhsData        as unknown as StockData },
  { key: 'ULTA',     data: ultaData       as unknown as StockData },
  { key: 'UNH',      data: unhData        as unknown as StockData },
  { key: 'UNP',      data: unpData        as unknown as StockData },
  { key: 'UPS',      data: upsData        as unknown as StockData },
  { key: 'URI',      data: uriData        as unknown as StockData },
  { key: 'USB',      data: usbData        as unknown as StockData },
  { key: 'V',        data: vData          as unknown as StockData },
  { key: 'VEEV',     data: veevData       as unknown as StockData },
  { key: 'VLO',      data: vloData        as unknown as StockData },
  { key: 'VMC',      data: vmcData        as unknown as StockData },
  { key: 'VRSK',     data: vrskData       as unknown as StockData },
  { key: 'VRSN',     data: vrsnData       as unknown as StockData },
  { key: 'VRTX',     data: vrtxData       as unknown as StockData },
  { key: 'VTR',      data: vtrData        as unknown as StockData },
  { key: 'VZ',       data: vzData         as unknown as StockData },
  { key: 'WAB',      data: wabData        as unknown as StockData },
  { key: 'WAT',      data: watData        as unknown as StockData },
  { key: 'WDAY',     data: wdayData       as unknown as StockData },
  { key: 'WDC',      data: wdcData        as unknown as StockData },
  { key: 'WEC',      data: wecData        as unknown as StockData },
  { key: 'WELL',     data: wellData       as unknown as StockData },
  { key: 'WFC',      data: wfcData        as unknown as StockData },
  { key: 'WM',       data: wmData         as unknown as StockData },
  { key: 'WMB',      data: wmbData        as unknown as StockData },
  { key: 'WMT',      data: wmtData        as unknown as StockData },
  { key: 'WRB',      data: wrbData        as unknown as StockData },
  { key: 'WSM',      data: wsmData        as unknown as StockData },
  { key: 'WST',      data: wstData        as unknown as StockData },
  { key: 'WTW',      data: wtwData        as unknown as StockData },
  { key: 'WY',       data: wyData         as unknown as StockData },
  { key: 'WYNN',     data: wynnData       as unknown as StockData },
  { key: 'XEL',      data: xelData        as unknown as StockData },
  { key: 'XOM',      data: xomData        as unknown as StockData },
  { key: 'XYL',      data: xylData        as unknown as StockData },
  { key: 'YUM',      data: yumData        as unknown as StockData },
  { key: 'ZBH',      data: zbhData        as unknown as StockData },
  { key: 'ZBRA',     data: zbraData       as unknown as StockData },
  { key: 'ZTS',      data: ztsData        as unknown as StockData },
  { key: 'VST',      data: vstData        as unknown as StockData },
  { key: 'HWM',      data: hwmData        as unknown as StockData },
  { key: 'BE',       data: beData         as unknown as StockData },
  { key: 'EXE',      data: exeData        as unknown as StockData },
  { key: 'FTV',      data: ftvData        as unknown as StockData },
  { key: 'TWLO',     data: twloData       as unknown as StockData },
]

// ── 색상 유틸 ───────────────────────────────────────────────
function cagrBarColor(cagr: number, isComplete: boolean) {
  if (!isComplete) return 'rgba(148,163,184,0.35)'
  if (cagr < 0)  return 'rgba(239,68,68,0.75)'
  if (cagr < 10) return 'rgba(249,115,22,0.75)'
  if (cagr < 15) return 'rgba(234,179,8,0.75)'
  if (cagr < 20) return 'rgba(16,185,129,0.75)'
  return 'rgba(59,130,246,0.85)'
}
function cagrTextColor(cagr: number, isComplete: boolean) {
  if (!isComplete) return 'text-gray-400 dark:text-gray-500'
  if (cagr < 0)  return 'text-red-500'
  if (cagr < 10) return 'text-orange-500'
  if (cagr < 15) return 'text-yellow-600 dark:text-yellow-400'
  if (cagr < 20) return 'text-emerald-600 dark:text-emerald-400'
  return 'text-blue-600 dark:text-blue-400'
}
function fmtTotalReturn(multiple: number) {
  const pct = (multiple - 1) * 100
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`
}
function epsGrowthColor(pct: number) {
  if (pct >= 15) return 'text-blue-600 dark:text-blue-400'
  if (pct >= 10) return 'text-emerald-600 dark:text-emerald-400'
  if (pct >= 5)  return 'text-yellow-600 dark:text-yellow-400'
  if (pct >= 0)  return 'text-orange-500 dark:text-orange-400'
  return 'text-red-500 dark:text-red-400'
}

// ── 롤링 차트 ────────────────────────────────────────────────
function RollingChart({ data }: { data: StockData }) {
  const chartRef = useRef<ChartJS | null>(null)
  const [pluginLoaded, setPluginLoaded] = useState(false)

  useEffect(() => {
    import('chartjs-plugin-zoom').then(({ default: z }) => {
      ChartJS.register(z)
      setPluginLoaded(true)
    })
  }, [])

  const rows = data.rows10y.filter(r => r.isComplete || r.yearsActual >= 9)
  const labels = rows.map(r => String(r.buyYear))
  const barColors = rows.map(r => cagrBarColor(r.cagr, r.isComplete))

  const sp500Points = rows.map(r =>
    'benchCagr' in r && r.benchCagr != null ? (r as any).benchCagr : null
  )

  // 가로선 플러그인 (0%, 10%, 15%, 20%)
  const refLinesPlugin = {
    id: 'refLines',
    afterDraw(chart: ChartJS) {
      const { ctx, scales: { y }, chartArea } = chart as any
      const lines = [
        { val: 0,  color: 'rgba(100,100,100,0.5)', dash: [4,4],  label: '0%' },
        { val: 10, color: 'rgba(16,185,129,0.4)',  dash: [3,3],  label: '10%' },
        { val: 15, color: 'rgba(234,179,8,0.4)',   dash: [3,3],  label: '15%' },
        { val: 20, color: 'rgba(59,130,246,0.4)',  dash: [3,3],  label: '20%' },
      ]
      ctx.save()
      lines.forEach(({ val, color, dash, label }) => {
        const yPx = y.getPixelForValue(val)
        if (yPx < chartArea.top || yPx > chartArea.bottom) return
        ctx.beginPath()
        ctx.setLineDash(dash)
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.moveTo(chartArea.left, yPx)
        ctx.lineTo(chartArea.right, yPx)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = color.replace('0.4', '0.7').replace('0.5', '0.7')
        ctx.font = '10px sans-serif'
        ctx.fillText(label, chartArea.right + 4, yPx + 3)
      })
      ctx.restore()
    },
  }

  const chartData = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: data.ticker,
        data: rows.map(r => r.cagr),
        backgroundColor: barColors,
        borderColor: barColors.map(c => c.replace(/[\d.]+\)$/, '1)')),
        borderWidth: 0.5,
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'S&P 500',
        data: sp500Points,
        borderColor: 'rgba(249,115,22,0.9)',
        backgroundColor: 'rgba(249,115,22,0.9)',
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 1.5,
        spanGaps: false,
        order: 1,
      },
    ],
  }

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { right: 32 } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, maxRotation: 45 },
      },
      y: {
        ticks: {
          font: { size: 11 },
          callback: (v: number) => `${v}%`,
        },
        grid: { color: 'rgba(128,128,128,0.1)' },
      },
    },
    plugins: {
      legend: { position: 'top' as const, labels: { font: { size: 11 }, boxWidth: 12 } },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)}%`,
          afterLabel: (ctx: any) => {
            const r = rows[ctx.dataIndex]
            if (ctx.datasetIndex === 0) {
              const extra = r.isComplete
                ? `${r.buyYear}→${r.sellYear}  ${fmtTotalReturn(r.multiple)}`
                : `진행 중 (${r.yearsActual}년 경과)`
              return extra
            }
            return ''
          },
        },
      },
      zoom: pluginLoaded ? {
        pan: { enabled: true, mode: 'x' },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
      } : {},
    },
    plugins_extra: [refLinesPlugin],
  }

  return (
    <div className="relative">
      <button
        onClick={() => (chartRef.current as any)?.resetZoom?.()}
        className="absolute top-0 right-0 z-10 px-2 py-0.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded"
      >
        줌 초기화
      </button>
      <div style={{ height: 320 }}>
        <Chart
          ref={chartRef as any}
          type="bar"
          data={chartData}
          options={options}
          plugins={[refLinesPlugin]}
        />
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">
        휠: 확대/축소 &nbsp;|&nbsp; 드래그: 이동
      </p>
    </div>
  )
}

// ── 요약 카드 ────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/60 rounded-lg px-3 py-2.5">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  )
}

// ── 롤링 테이블 ──────────────────────────────────────────────
function RollingTable({ data }: { data: StockData }) {
  const rows = [
    ...data.rows10y.filter(r => r.isComplete),
    ...data.rows10y.filter(r => !r.isComplete && r.yearsActual >= 9),
  ]
  const s = data.stats
  const epsDecomp = (data as any).epsDecomp as Array<{
    buyYear: number; epsGrowthCagr: number; peSell: number; note: string | null
  }>
  const epsNote: string | undefined = (data as any).epsNote
  const epsMap = new Map(epsDecomp?.map(e => [e.buyYear, e]) ?? [])

  return (
    <div className="space-y-5">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <StatCard label="완결 구간" value={`${s.n}개`} />
        <StatCard label="중앙값 CAGR" value={s.median != null ? `${s.median}%` : '-'} />
        <StatCard label="최저" value={s.min != null ? `${s.min}% (${s.minBuy}년)` : '-'} />
        <StatCard label="최고" value={s.max != null ? `${s.max}% (${s.maxBuy}년)` : '-'} />
        <StatCard label="손실 구간" value={`${s.losses}개`} />
        <StatCard label="연 10% 초과" value={s.over10 != null ? `${s.over10}%` : '-'} />
        <StatCard label="연 15% 초과" value={s.over15 != null ? `${s.over15}%` : '-'} />
        <StatCard label="연 20% 초과" value={s.over20 != null ? `${s.over20}%` : '-'} />
        {s.beatBench != null && (
          <StatCard label="S&P 500 초과" value={`${s.beatBench} / ${s.beatTotal}개`} />
        )}
        <StatCard
          label="전체 기간"
          value={`${data.fullPeriod.cagr}% · ${data.fullPeriod.multiple}x`}
        />
      </div>

      {data.note && (
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded px-3 py-2">
          ⚠ {data.note}
        </p>
      )}

      {/* 완결 구간 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
              <th className="text-left py-2 pr-3 font-medium">매수</th>
              <th className="text-left py-2 pr-3 font-medium">평가</th>
              <th className="text-right py-2 pr-3 font-medium">연복리<br/><span className="font-normal opacity-60">(배당포함)</span></th>
              <th className="text-right py-2 pr-3 font-medium">누적 수익률</th>
              <th className="text-right py-2 pr-3 font-medium">EPS 성장<br/><span className="font-normal opacity-60">(연복리)</span></th>
              <th className="text-right py-2 pr-3 font-medium">매수 PER</th>
              <th className="text-right py-2 pr-3 font-medium">매도 PER</th>
              <th className="text-right py-2 pr-3 font-medium">S&P 500<br/><span className="font-normal opacity-60">(배당포함)</span></th>
              <th className="text-right py-2 font-medium">차이</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map(r => {
              const diff    = 'diff' in r ? (r as any).diff as number : null
              const bc      = 'benchCagr' in r ? (r as any).benchCagr as number : null
              const peBuy   = 'peBuy' in r ? ((r as any).peBuyActual ?? (r as any).peBuy) as number : null
              const eps     = epsMap.get(r.buyYear)
              const inProg  = !r.isComplete
              return (
                <tr key={r.buyYear} className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 ${inProg ? 'opacity-50' : ''}`}>
                  <td className="py-1.5 pr-3 text-gray-600 dark:text-gray-300 tabular-nums">
                    {r.buyYear}
                    {eps?.note && <span title={eps.note} className="ml-1 text-amber-500 cursor-help text-xs">⚠</span>}
                  </td>
                  <td className="py-1.5 pr-3 text-gray-600 dark:text-gray-300 tabular-nums">
                    {inProg ? <span className="italic text-gray-400 dark:text-gray-500">진행 중</span> : r.sellYear}
                  </td>
                  <td className={`py-1.5 pr-3 text-right font-semibold tabular-nums ${cagrTextColor(r.cagr, !inProg)}`}>
                    {r.cagr.toFixed(1)}%
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-gray-500 dark:text-gray-400">
                    {fmtTotalReturn(r.multiple)}
                  </td>
                  <td className={`py-1.5 pr-3 text-right tabular-nums ${eps ? epsGrowthColor(eps.epsGrowthCagr) : 'text-gray-300 dark:text-gray-600'}`}>
                    {eps ? `+${eps.epsGrowthCagr.toFixed(1)}%` : '—'}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-gray-400 dark:text-gray-500">
                    {peBuy != null ? `${peBuy.toFixed(0)}x` : '—'}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-gray-400 dark:text-gray-500">
                    {eps ? `${eps.peSell.toFixed(0)}x` : '—'}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-gray-400 dark:text-gray-500">
                    {bc != null ? `${bc.toFixed(1)}%` : '—'}
                  </td>
                  <td className={`py-1.5 text-right tabular-nums font-medium ${diff == null ? 'text-gray-400' : diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {diff != null ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}pp` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>


      {/* EPS 주석 */}
      {epsNote && (
        <p className="text-xs text-gray-300 dark:text-gray-600">{epsNote}</p>
      )}

      {/* 범례 */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
        <span className="text-blue-600 dark:text-blue-400">■ 20%+</span>
        <span className="text-emerald-600 dark:text-emerald-400">■ 15~20%</span>
        <span className="text-yellow-600 dark:text-yellow-400">■ 10~15%</span>
        <span className="text-orange-500 dark:text-orange-400">■ 0~10%</span>
        <span className="text-red-500 dark:text-red-400">■ 손실</span>
      </div>
    </div>
  )
}


// ── 미래 수익률 시나리오 테이블 ──────────────────────────────
function ScenarioTable({ data, pe0, title = '지금 사서 10년 보유 시 예상 수익률' }: { data: StockData; pe0?: number; title?: string }) {
  const c = data.current as { price: number; pe: number; divYield: number; eps: number }
  const [pe,  setPE]  = useState(pe0 != null ? Math.round(pe0 * 2) / 2 : (c.pe ?? 20))
  const [div, setDiv] = useState(c.divYield ?? 1)

  const growthRates = [0, 3, 5, 8, 10, 12, 15, 20]
  const endPEs      = [15, 20, 25, 30, 35, 40, 50]

  // 10년 연환산 CAGR 계산
  // Total 10yr multiple = (1+g)^10 × (endPE/startPE) × (1+div/100)^10
  // div_yield는 대략 일정하다고 가정 (배당이 이익과 같이 성장)
  function calcCAGR(g: number, endPE: number): number {
    const priceFactor = Math.pow(1 + g / 100, 10) * (endPE / pe)
    const totalFactor = priceFactor * Math.pow(1 + div / 100, 10)
    return (Math.pow(totalFactor, 1 / 10) - 1) * 100
  }

  function cellColor(cagr: number): string {
    if (cagr < 0)  return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
    if (cagr < 5)  return 'bg-orange-50 dark:bg-orange-900/15 text-orange-600 dark:text-orange-400'
    if (cagr < 10) return 'bg-yellow-50 dark:bg-yellow-900/15 text-yellow-700 dark:text-yellow-400'
    if (cagr < 15) return 'bg-emerald-50 dark:bg-emerald-900/15 text-emerald-700 dark:text-emerald-400'
    if (cagr < 20) return 'bg-blue-50 dark:bg-blue-900/15 text-blue-700 dark:text-blue-400'
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-semibold'
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">
          {title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          현재 P/E와 배당수익률을 기준으로, EPS 성장률과 10년 후 P/E에 따른 연환산 수익률
        </p>
      </div>

      {/* 입력값 */}
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-400 text-xs">현재 P/E</span>
          <input
            type="number"
            step="0.5"
            value={pe}
            onChange={e => setPE(Number(e.target.value))}
            className="w-16 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-right"
          />
          <span className="text-gray-400 text-xs">x</span>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-400 text-xs">배당수익률</span>
          <input
            type="number"
            step="0.1"
            value={div}
            onChange={e => setDiv(Number(e.target.value))}
            className="w-16 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-right"
          />
          <span className="text-gray-400 text-xs">%</span>
        </label>
        {c.eps != null && c.price != null && (
          <span className="text-xs text-gray-400 self-center">
            참고: TTM EPS {c.eps} {data.currency} · 주가 {c.price} {data.currency}
          </span>
        )}
      </div>

      {/* 시나리오 테이블 */}
      <div className="overflow-x-auto">
        <table className="text-xs">
          <thead>
            <tr className="text-gray-400 dark:text-gray-500">
              <th className="text-left py-1.5 pr-3 font-medium whitespace-nowrap">EPS 성장률 ↓ / 10년 후 P/E →</th>
              {endPEs.map(ep => (
                <th key={ep} className={`text-right py-1.5 px-2 font-medium ${ep === pe ? 'text-blue-500' : ''}`}>
                  {ep}x{ep === Math.round(pe) ? ' ★' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {growthRates.map(g => (
              <tr key={g} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <td className="py-1.5 pr-3 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">
                  연 {g}% 성장
                </td>
                {endPEs.map(ep => {
                  const cagr = calcCAGR(g, ep)
                  return (
                    <td key={ep} className={`py-1.5 px-2 text-right tabular-nums rounded ${cellColor(cagr)}`}>
                      {cagr.toFixed(1)}%
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        계산식: 연환산 수익률 = [(1+EPS성장)^10 × (목표P/E÷현재P/E) × (1+배당수익률)^10]^(1/10) − 1<br />
        배당이 이익과 같이 성장한다고 가정. 참고용 추정치이며 미래 보장 없음.
      </p>
    </div>
  )
}

// ── 종목 비교 개요 ───────────────────────────────────────────
function median(arr: number[]) {
  const s = [...arr].sort((a, b) => a - b)
  return s.length % 2 === 0
    ? (s[s.length / 2 - 1] + s[s.length / 2]) / 2
    : s[Math.floor(s.length / 2)]
}

function diffColor(v: number) {
  if (v >= 10) return 'text-blue-600 dark:text-blue-400'
  if (v >= 5)  return 'text-emerald-600 dark:text-emerald-400'
  if (v >= 0)  return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-500 dark:text-red-400'
}

type SortKey = 'fullCagr' | 'cagrMn' | 'cagrMed' | 'cagrMx' | 'diffMn' | 'diffMed' | 'diffMx' | 'roe' | 'roic' | 'score' | 'fairGap'
type SubKey = 'moat' | 'pricing' | 'profit' | 'growth' | 'durability'
const SUB_LABEL: Record<SubKey, string> = { moat: '경쟁우위', pricing: '가격결정력', profit: '수익성', growth: '성장성', durability: '지속가능성' }
type FairInfo = { fairPe: number; eps: number; t: number; price: number; priceDate: string }
type QualInfo = { roe: number | null; roic: number | null; q?: Quality; score: number | null; group: GroupKey | null; fair?: FairInfo; g?: number }
// 이익 시계와 같은 성장률: 개별 분석 판단(0.5 단위) → 없으면 과거 5·10년 중 낮은 값(0~15%)
function clockGrowth(key: string, g10?: number | null, g5?: number | null) {
  const clamp = (v: number) => Math.max(0, Math.min(15, v))
  const base = g10 != null && g5 != null ? clamp(Math.min(g10, g5)) : g10 != null ? clamp(g10) : g5 != null ? clamp(g5) : 5
  return Math.round((DEEP_INSIGHTS[key]?.growth.base ?? base) * 2) / 2
}
// 적정가 대비(%) = 주가 ÷ (마지막 EPS × (1+성장률)^경과 연수 × 적정 PER) − 1  — 이익 시계 '적정가 대비'와 같은 계산
function fairGapOf(fi: FairInfo, g: number, tNow: number) {
  const epsNow = fi.eps * Math.pow(1 + g / 100, Math.max(0, tNow - fi.t))
  return fi.eps > 0 && epsNow > 0 ? (fi.price / (epsNow * fi.fairPe) - 1) * 100 : null
}
const TIP_FAIR = <>이익 시계의 &lsquo;적정가 대비&rsquo;와 같은 숫자. 적정가 = 최근 1년 EPS(마지막 실적 이후는 성장률로 늘림) × 적정 PER.
  <br />적정 PER = 지난 20년 월말 PER의 중간값(에르메스는 거품기 2019~2025년을 뺀 중간값).
  <br />성장률 = 개별 분석 판단, 없으면 과거 5·10년 EPS 성장률 중 낮은 값(0~15%).
  <br />마이너스(초록) = 적정가보다 쌈, 플러스(빨강) = 비쌈. 이익이 크게 줄었거나 적자인 종목은 빈칸.</>

// 마우스를 올리거나(휴대폰은 ? 를 누르면) 설명이 뜨는 작은 도움말
function Tip({ children, text, below = false, right = false }: { children: ReactNode; text: ReactNode; below?: boolean; right?: boolean }) {
  return (
    <span className="relative group/tip inline-flex items-center">
      {children}
      <span tabIndex={0} className="ml-0.5 text-gray-400 cursor-help outline-none">?</span>
      <span className={`absolute ${below ? 'top-full mt-1.5' : 'bottom-full mb-2'} ${right ? 'right-0' : 'left-0'} w-64 z-50
                        invisible opacity-0 group-hover/tip:visible group-hover/tip:opacity-100 group-focus-within/tip:visible group-focus-within/tip:opacity-100
                        transition-opacity duration-150 pointer-events-none whitespace-normal text-left font-normal
                        bg-gray-900 text-white text-xs rounded-md px-2.5 py-2 shadow-lg leading-relaxed`}>
        {text}
      </span>
    </span>
  )
}

const TIP_ROE = <>순이익 ÷ 자기자본(5년 중간값). 주주 돈 1달러로 1년에 얼마를 버는지. 20% 이상이면 우수.
  <br />주의: 자사주를 많이 사서 자기자본이 작아진 회사(애플·마스터카드)는 100% 넘게 부풀려지고, 현금을 쌓아 둔 회사(에르메스)는 낮게 나온다. 사업의 질은 ROIC로 보는 게 낫다.</>
const TIP_ROIC = <>세후 영업이익 ÷ 사업에 실제로 묶인 돈(자기자본 + 차입금 − 현금), 5년 중간값. 사업 자체가 얼마나 좋은지 보는 숫자. 15% 이상 좋음, 30% 이상 최상위.
  <br />은행·보험은 값이 없어 이 필터를 켜면 빠진다.
  <br /><b>쓰는 요령:</b> ROIC ≥ 20 + 절대수익 중앙값 ≥ 15 → 사업도 좋고 과거 수익도 좋았던 종목만 남는다.</>
const TIP_GRADE = <>Claude가 매긴 정성 평가(종목 아이디어 탭과 같은 값). A 위대한 기업 · B 좋은 기업 · C 보통 · D 주의.</>
const TIP_SCORE = <>사업성 = 경쟁우위·가격결정력·수익성·성장성·지속가능성 각 5점, 합 25점 만점(Claude 정성 평가). 20점 이상이면 최상위권.</>
const TIP_SUB = <>다섯 항목 중 하나를 골라 그 점수(1~5) 이상만 남긴다. 예: 성장성 ≥ 4 → 성장성이 높은 기업만.</>
const TIP_GROUP = <>지금 상태에 따른 분류(종목 아이디어 탭 기본 기준과 같음). 기업의 질이 아니라 &lsquo;지금 어떤 상황인가&rsquo;다.
  <br />주가만 쉬는 중: 이익은 괜찮은데 PER이 평소보다 낮거나 주가가 많이 빠짐
  <br />이익 주춤: 이익이 고점보다 15% 넘게 낮음
  <br />꾸준·적당: A등급, 이익 성장, PER이 평소 수준
  <br />지금은 비쌈: PER이 평소보다 30% 넘게 높음</>

// ── 종목 비교 표 필터 ─────────────────────────────────────────
type FilterSnap = {
  minPeriods: number; minCagrMin: number | ''; minMedian: number; minDiffMin: number | ''; minDiffMedian: number
  maxRange: number | ''; excludeEtf: boolean; minRoe: number | ''; minRoic: number | ''
  gradeF: 'all' | 'A' | 'AB'; minScore: number | ''; subMins: Partial<Record<SubKey, number>>; groupF: 'all' | GroupKey
  maxFairGap: number | ''
}
const DEFAULT_F: FilterSnap = {
  minPeriods: 0, minCagrMin: '', minMedian: 0, minDiffMin: '', minDiffMedian: 0, maxRange: '', excludeEtf: false,
  minRoe: '', minRoic: '', gradeF: 'all', minScore: '', subMins: {}, groupF: 'all', maxFairGap: '',
}
// 저장된 프리셋(예전 형식 포함)을 빠짐없는 필터 값으로 맞춘다. 빠진 값은 '필터 없음'
function normFilter(f: Record<string, any>): FilterSnap {
  const subMins: Partial<Record<SubKey, number>> = { ...(f.subMins ?? {}) }
  if (f.subKey && f.minSub !== '' && f.minSub != null) subMins[f.subKey as SubKey] = Number(f.minSub) // 예전 형식
  const out: any = { ...DEFAULT_F }
  for (const k of Object.keys(DEFAULT_F)) if (k !== 'subMins' && f[k] != null) out[k] = f[k]
  out.subMins = subMins
  return out
}
const sameFilter = (a: FilterSnap, b: FilterSnap) => {
  const sa = Object.entries(a.subMins).filter(([, v]) => v != null).sort(), sb = Object.entries(b.subMins).filter(([, v]) => v != null).sort()
  return (Object.keys(DEFAULT_F) as (keyof FilterSnap)[]).every(k => k === 'subMins' || a[k] === b[k]) && JSON.stringify(sa) === JSON.stringify(sb)
}
type FilterRow = {
  s: any; completedCount: number; cagrMn: number | null; cagrMed: number | null; cagrMx: number | null
  diffMn: number | null; diffMed: number | null; roe: number | null; roic: number | null; score: number | null; q?: Quality; group: GroupKey | null
  fairGap: number | null
}
function passesFilter(row: FilterRow, F: FilterSnap): boolean {
  if (F.minPeriods > 0 && row.completedCount < F.minPeriods) return false
  if (F.minCagrMin !== '' && (row.cagrMn == null || row.cagrMn < F.minCagrMin)) return false
  if (F.minMedian > 0 && (row.cagrMed == null || row.cagrMed < F.minMedian)) return false
  if (F.minDiffMin !== '' && (row.diffMn == null || row.diffMn < F.minDiffMin)) return false
  if (F.minDiffMedian !== 0 && (row.diffMed == null || row.diffMed < F.minDiffMedian)) return false
  if (F.maxRange !== '' && (row.cagrMx == null || row.cagrMn == null || (row.cagrMx - row.cagrMn) > F.maxRange)) return false
  if (F.excludeEtf && (row.s.data as any).type === 'etf') return false
  if (F.minRoe !== '' && (row.roe == null || row.roe < F.minRoe)) return false
  if (F.minRoic !== '' && (row.roic == null || row.roic < F.minRoic)) return false
  if (F.gradeF === 'A' && row.q?.grade !== 'A') return false
  if (F.gradeF === 'AB' && row.q?.grade !== 'A' && row.q?.grade !== 'B') return false
  if (F.minScore !== '' && (row.score == null || row.score < F.minScore)) return false
  for (const [k, v] of Object.entries(F.subMins) as [SubKey, number][]) if (v != null && (row.q == null || row.q[k] < v)) return false
  if (F.groupF !== 'all' && row.group !== F.groupF) return false
  if (F.maxFairGap !== '' && (row.fairGap == null || row.fairGap > F.maxFairGap)) return false
  return true
}

// Claude 추천 프리셋 (코드에 고정, 어느 기기에서나 보임). 근거는 툴팁에
const BUILTIN_PRESETS: Array<{ name: string; why: string; f: Partial<FilterSnap> }> = [
  { name: '① 위대한 기업 정석', why: '등급 A + 사업성 20점 이상 + ROIC 20% 이상. Claude 정성 평가와 실제 숫자(ROIC)가 둘 다 높은 기업만.',
    f: { excludeEtf: true, gradeF: 'A', minScore: 20, minRoic: 20 } },
  { name: '② 오래 증명된 기업', why: 'A·B등급 + 10년 보유 결과 10번 이상 + 가장 나쁜 해에 샀어도 연 5% 이상 + 중앙값 연 12% 이상. 운이 아니라 꾸준함.',
    f: { excludeEtf: true, gradeF: 'AB', minPeriods: 10, minCagrMin: 5, minMedian: 12 } },
  { name: '③ 시장을 한 번도 안 진 기업', why: '10년 보유 결과 10번 이상 + 어느 해에 샀든 S&P 500 이상(초과수익 최솟값 0 이상) + 초과수익 중앙값 3%p 이상.',
    f: { excludeEtf: true, minPeriods: 10, minDiffMin: 0, minDiffMedian: 3 } },
  { name: '④ 최정예', why: '①(정석)에 ②의 과거 성과 조건(10번 이상, 최솟값 연 5% 이상)을 더함. 지금 사업도 좋고 과거로도 증명된 핵심 명단.',
    f: { excludeEtf: true, gradeF: 'A', minScore: 20, minRoic: 20, minPeriods: 10, minCagrMin: 5 } },
  { name: '성장형', why: '성장성 4점 이상 + ROIC 15% 이상 + 10년 수익 중앙값 연 15% 이상.',
    f: { excludeEtf: true, subMins: { growth: 4 }, minRoic: 15, minMedian: 15 } },
  { name: '버핏형', why: '지속가능성 5점 + 경쟁우위 4점 이상 + ROIC 15% 이상. 오래가는 기업.',
    f: { excludeEtf: true, subMins: { durability: 5, moat: 4 }, minRoic: 15 } },
  { name: '에르메스형', why: '가격결정력 5점 + 경쟁우위 5점 + ROIC 25% 이상. 값을 올려도 고객이 떠나지 않는 기업.',
    f: { excludeEtf: true, subMins: { pricing: 5, moat: 5 }, minRoic: 25 } },
  { name: '⑥ 최정예 · 주가만 쉬는 중', why: '④ 최정예 중 이익은 괜찮은데 PER이 평소보다 싸거나 주가가 3년 고점보다 20% 넘게 빠진 종목. 실제 매수 후보 보기용. 주가에 따라 매일 바뀐다.',
    f: { excludeEtf: true, gradeF: 'A', minScore: 20, minRoic: 20, minPeriods: 10, minCagrMin: 5, groupF: 'pause' } },
  { name: '⑦ 이익 주춤 (주의)', why: '좋은 기업인데 이익이 고점보다 15% 넘게 줄어든 종목. 싸 보여도 일시적인지 구조적인지 확인이 필요한 관찰 명단(사라는 뜻 아님).',
    f: { excludeEtf: true, groupF: 'stumble' } },
]

function OverviewTable({
  activeStock,
  setActiveStock,
}: {
  activeStock: number
  setActiveStock: (i: number) => void
}) {
  const [sortKey, setSortKey] = useState<SortKey>('diffMn')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'all' | 'starred'>('all')
  const [starred, setStarred] = useState<Set<string>>(new Set())
  // 필터는 한 묶음으로 관리. 새로고침하면 항상 전체 목록(필터 없음)으로 시작한다
  const [F, setF] = useState<FilterSnap>(DEFAULT_F)
  const set = <K extends keyof FilterSnap>(k: K, v: FilterSnap[K]) => setF(p => ({ ...p, [k]: v }))
  const [subKey, setSubKey] = useState<SubKey>('growth')
  // 사업의 질: ROE·ROIC 5년 중간값(_summary.json) + Claude 정성 평가(_quality.json) — 종목 아이디어 탭과 같은 자료
  const [qual, setQual] = useState<Record<string, QualInfo>>({})
  useEffect(() => {
    Promise.all([
      fetch('/data/fundamentals/_summary.json').then(r => (r.ok ? r.json() : null)),
      fetch('/data/fundamentals/_quality.json').then(r => (r.ok ? r.json() : null)),
      fetch('/data/fundamentals/_fair.json').then(r => (r.ok ? r.json() : null)),
      fetch('/data/rolling/RMS_monthly_price.json').then(r => (r.ok ? r.json() : null)),
    ]).then(([sm, ql, fr, rmsPx]) => {
      const fairs = (fr?.stocks ?? {}) as Record<string, FairInfo>
      const qs = (ql?.stocks ?? {}) as Record<string, Quality>
      const m: Record<string, QualInfo> = {}
      for (const x of [...((sm?.stocks ?? []) as Metrics[]), ...EXTRA_METRICS]) {
        const q = qs[x.key]
        m[x.key] = {
          roe: (x as any).roe5 ?? (x as any).roe ?? null, roic: (x as any).roic5 ?? (x as any).roic ?? null,
          q, score: q ? qualityScore(q) : null, group: classify(x, q, 'moat'),
          fair: fairs[x.key], g: clockGrowth(x.key, x.epsCagr10, x.epsCagr5),
        }
      }
      // 에르메스: 이익 시계와 같게 — 거품기 뺀 20년 PER 중간값, 4번 '기본' 성장률
      if (rmsPx && m.RMS) {
        const epsAt = makeEpsAt(RMS_ANCHORS, 0)
        const tLast = RMS_ANCHORS[RMS_ANCHORS.length - 1][0]
        const pes = (rmsPx.rows as Array<{ d: string; c: number }>).map(r => { const [y, mo] = r.d.split('-').map(Number); const t = y + mo / 12; const e = epsAt(t); return { t, pe: e && e > 0 ? r.c / e : null } })
          .filter(r => r.t >= tLast - 20 && r.t <= tLast && !(r.t >= 2019 && r.t < 2026) && r.pe != null && r.pe > 0 && r.pe < 200).map(r => r.pe as number)
        if (pes.length >= 24) m.RMS = { ...m.RMS, fair: { fairPe: Math.round(quantile(pes, 0.5)), eps: RMS_ANCHORS[RMS_ANCHORS.length - 1][1], t: tLast, price: rmsPx.last.close, priceDate: rmsPx.last.date }, g: epsGrowthOf(HERMES_SCENARIOS[0].f) }
      }
      for (const [k, q] of Object.entries(qs)) if (!m[k]) m[k] = { roe: null, roic: null, q, score: qualityScore(q), group: null }
      setQual(m)
    }).catch(() => {})
  }, [])
  const [presets, setPresets] = useState<Array<{name: string; f: Record<string, unknown>}>>([])
  const [presetInput, setPresetInput] = useState('')
  const [savingPreset, setSavingPreset] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('private_starred')
      if (saved) setStarred(new Set(JSON.parse(saved)))
    } catch {}
    try {
      // 예전에 저장된 필터 값은 쓰지 않는다(정렬만 기억)
      const f = JSON.parse(localStorage.getItem('private_filters') ?? '{}')
      if (f.sortKey) setSortKey(f.sortKey)
      if (f.sortDir) setSortDir(f.sortDir)
    } catch {}
    try {
      const p = JSON.parse(localStorage.getItem('private_presets') ?? '[]')
      if (Array.isArray(p)) setPresets(p)
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem('private_filters', JSON.stringify({ sortKey, sortDir })) } catch {}
  }, [sortKey, sortDir])

  function currentFilterSnapshot() { return F }

  // 프리셋 적용 = 모든 필터를 먼저 끄고 그 프리셋 값만 켠다(앞 프리셋과 섞이지 않게). 같은 프리셋을 다시 누르면 해제
  function applyPreset(f: Record<string, unknown>) {
    const next = normFilter(f)
    if (sameFilter(next, F)) { setF(DEFAULT_F); return }
    setF(next)
    setViewMode('all')
  }

  function savePreset() {
    const name = presetInput.trim()
    if (!name) return
    const next = [...presets.filter(p => p.name !== name), { name, f: currentFilterSnapshot() }]
    setPresets(next)
    try { localStorage.setItem('private_presets', JSON.stringify(next)) } catch {}
    setPresetInput('')
    setSavingPreset(false)
  }

  function deletePreset(name: string) {
    const next = presets.filter(p => p.name !== name)
    setPresets(next)
    try { localStorage.setItem('private_presets', JSON.stringify(next)) } catch {}
  }

  function toggleStar(key: string, e: React.MouseEvent) {
    e.stopPropagation()
    setStarred(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      try { localStorage.setItem('private_starred', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function colBg(col: SortKey) {
    return sortKey === col ? 'bg-blue-50 dark:bg-blue-900/25' : ''
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="ml-0.5 opacity-30">↕</span>
    return <span className="ml-0.5 text-blue-500">{sortDir === 'desc' ? '↓' : '↑'}</span>
  }

  function SortTh({ col, children, className }: { col: SortKey; children: React.ReactNode; className?: string }) {
    return (
      <th
        className={`cursor-pointer select-none whitespace-nowrap hover:text-gray-700 dark:hover:text-gray-200 transition-colors ${colBg(col)} ${className ?? ''}`}
        onClick={() => handleSort(col)}
      >
        {children}<SortIcon col={col} />
      </th>
    )
  }

  const [tNowYr] = useState(() => decYear(Date.now()))
  const allRows = STOCKS.map((s, i) => {
    const allCompleted = s.data.rows10y.filter((r: any) => r.isComplete)
    const completedCount = allCompleted.length
    const completed  = allCompleted.slice(-15)
    const cagrs      = completed.map((r: any) => r.cagr as number)
    const cagrMn     = cagrs.length ? Math.min(...cagrs) : null
    const cagrMx     = cagrs.length ? Math.max(...cagrs) : null
    const cagrMed    = cagrs.length ? median(cagrs)      : null
    const withDiff   = completed.filter((r: any) => r.diff != null)
    const diffs      = withDiff.map((r: any) => r.diff as number)
    const diffMn     = diffs.length ? Math.min(...diffs) : null
    const diffMx     = diffs.length ? Math.max(...diffs) : null
    const diffMed    = diffs.length ? median(diffs) : null
    const fullCagr   = s.data.fullPeriod.cagr
    const qi   = qual[s.key]
    const roe  = qi?.roe ?? null
    const roic = qi?.roic ?? null
    const score = qi?.score ?? null
    const fairGap = qi?.fair && qi.g != null ? fairGapOf(qi.fair, qi.g, tNowYr) : null
    return { i, s, fullCagr, cagrMn, cagrMed, cagrMx, diffMn, diffMed, diffMx, completedCount, roe, roic, score, q: qi?.q, group: qi?.group ?? null, fairGap }
  }).sort((a, b) => {
    const va = a[sortKey] ?? -Infinity
    const vb = b[sortKey] ?? -Infinity
    return sortDir === 'desc' ? vb - va : va - vb
  })

  // 검색어가 있으면 필터·즐겨찾기 보기를 잠시 무시하고 전체에서 찾는다(검색해도 안 나오는 문제 방지)
  const q = search.trim().toLowerCase()
  const searching = q.length > 0
  const rows = allRows.filter(row => {
    if (searching) return row.s.key.toLowerCase().includes(q) || row.s.data.name.toLowerCase().includes(q)
    if (viewMode === 'starred' && !starred.has(row.s.key)) return false
    return passesFilter(row, F)
  })
  const builtinNorm = BUILTIN_PRESETS.map(bp => ({ ...bp, nf: normFilter(bp.f), n: allRows.filter(r => passesFilter(r, normFilter(bp.f))).length }))

  return (
    <div>
      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          type="text"
          placeholder="티커·종목명 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 w-44 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        {searching && (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            검색 중 — 필터·즐겨찾기는 잠시 무시하고 전체에서 찾는다
            <button type="button" onClick={() => setSearch('')} className="ml-1 underline">지우기</button>
          </span>
        )}
<div className="ml-auto flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 transition-colors ${
              viewMode === 'all'
                ? 'bg-blue-500 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            전체 {allRows.length}
          </button>
          <button
            onClick={() => setViewMode('starred')}
            className={`px-3 py-1.5 border-l border-gray-200 dark:border-gray-700 transition-colors ${
              viewMode === 'starred'
                ? 'bg-blue-500 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            ★ 즐겨찾기 {starred.size > 0 ? `(${starred.size})` : ''}
          </button>
        </div>
      </div>

      {/* 프리셋 행 */}
      {(presets.length > 0 || true) && (<>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs text-gray-400 dark:text-gray-600 shrink-0">
            <Tip text={<>누르면 그 조건만 켜진다(앞 필터는 꺼짐). 같은 버튼을 다시 누르면 해제. 괄호 안 = 걸리는 종목 수. 새로고침하면 항상 전체 목록으로 시작한다.</>}>추천 프리셋</Tip>
          </span>
          {builtinNorm.map(bp => {
            const on = sameFilter(bp.nf, F)
            return (
              <span key={bp.name} className="relative group/bp inline-flex">
                <button type="button" onClick={() => applyPreset(bp.f as Record<string, unknown>)}
                  className={`text-xs rounded-full px-2.5 py-1 border transition-colors ${on
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-900/10 hover:border-blue-400'}`}>
                  {bp.name} <span className={on ? 'opacity-80' : 'opacity-60'}>({bp.n})</span>
                </button>
                <span className="absolute top-full left-0 mt-1.5 w-64 z-50 invisible opacity-0 group-hover/bp:visible group-hover/bp:opacity-100
                                 transition-opacity duration-150 pointer-events-none bg-gray-900 text-white text-xs rounded-md px-2.5 py-2 shadow-lg leading-relaxed">
                  {bp.why}
                </span>
              </span>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs text-gray-400 dark:text-gray-600 shrink-0">내 프리셋:</span>
          {presets.map(p => (
            <span key={p.name}
              className={`inline-flex items-center gap-1 text-xs border rounded-full px-2.5 py-1 cursor-pointer transition-colors ${sameFilter(normFilter(p.f as Record<string, any>), F)
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 text-gray-600 dark:text-gray-400'}`}>
              <span onClick={() => applyPreset(p.f)}>{p.name}</span>
              <button onClick={() => deletePreset(p.name)}
                className="ml-0.5 text-gray-400 dark:text-gray-500 hover:text-red-400 dark:hover:text-red-500 transition-colors leading-none">
                ×
              </button>
            </span>
          ))}
          {savingPreset ? (
            <span className="inline-flex items-center gap-1">
              <input
                autoFocus
                value={presetInput}
                onChange={e => setPresetInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') savePreset(); if (e.key === 'Escape') { setSavingPreset(false); setPresetInput('') } }}
                placeholder="이름 입력..."
                className="text-xs border border-blue-400 dark:border-blue-500 rounded px-2 py-1 bg-transparent
                           text-gray-900 dark:text-white focus:outline-none w-28"
              />
              <button onClick={savePreset}
                className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors px-1">
                저장
              </button>
              <button onClick={() => { setSavingPreset(false); setPresetInput('') }}
                className="text-xs text-gray-400 hover:text-gray-500 transition-colors px-1">
                취소
              </button>
            </span>
          ) : (
            <button onClick={() => setSavingPreset(true)}
              className="text-xs text-gray-400 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400
                         border border-dashed border-gray-200 dark:border-gray-800
                         hover:border-blue-400 dark:hover:border-blue-500
                         rounded-full px-2.5 py-1 transition-colors">
              + 저장
            </button>
          )}
        </div>
      </>)}

      {/* 필터 행 */}
      {(() => {
        const inputCls = "w-9 text-center bg-transparent text-gray-900 dark:text-white focus:outline-none"
        const labelCls = "flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5"
        const hasFilter = !sameFilter(F, DEFAULT_F)
        return (
          <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
            <label className={labelCls}>
              완결 구간
              <input type="number" min={0} max={40} value={F.minPeriods || ''} placeholder="0"
                onChange={e => set('minPeriods', Number(e.target.value) || 0)} className={inputCls} />
              개 이상
            </label>
            <label className={labelCls}>
              절대수익 최솟값 ≥
              <input type="number" min={-30} max={100} value={F.minCagrMin} placeholder="—"
                onChange={e => set('minCagrMin', e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} />
              %
            </label>
            <label className={labelCls}>
              절대수익 중앙값 ≥
              <input type="number" min={0} max={100} value={F.minMedian || ''} placeholder="0"
                onChange={e => set('minMedian', Number(e.target.value) || 0)} className={inputCls} />
              %
            </label>
            <label className={labelCls}>
              초과수익 최솟값 ≥
              <input type="number" min={-50} max={100} value={F.minDiffMin} placeholder="—"
                onChange={e => set('minDiffMin', e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} />
              pp
            </label>
            <label className={labelCls}>
              초과수익 중앙값 ≥
              <input type="number" min={-20} max={100} value={F.minDiffMedian || ''} placeholder="0"
                onChange={e => set('minDiffMedian', Number(e.target.value) || 0)} className={inputCls} />
              pp
            </label>
            <label className={labelCls}>
              <span className="relative group/tip">
                수익 범위 ≤
                <span className="ml-0.5 text-gray-400 cursor-help">?</span>
                <span className="absolute bottom-full left-0 mb-2 w-56 z-50
                                 invisible group-hover/tip:visible opacity-0 group-hover/tip:opacity-100
                                 transition-opacity duration-150 pointer-events-none
                                 bg-gray-900 text-white text-xs rounded-md px-2.5 py-2 shadow-lg leading-relaxed">
                  최댓값 − 최솟값. 작을수록 언제 사도 결과가 비슷한 일관된 기업. 클수록 타이밍에 따라 수익 차이가 큰 기업.
                  <span className="absolute top-full left-4 border-4 border-transparent border-t-gray-900" />
                </span>
              </span>
              <input type="number" min={0} max={200} value={F.maxRange} placeholder="—"
                onChange={e => set('maxRange', e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} />
              %
            </label>
            <label className={labelCls}>
              <Tip text={TIP_ROE}>ROE ≥</Tip>
              <input type="number" min={-50} max={300} value={F.minRoe} placeholder="—"
                onChange={e => set('minRoe', e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} />
              %
            </label>
            <label className={labelCls}>
              <Tip text={TIP_ROIC}>ROIC ≥</Tip>
              <input type="number" min={-50} max={300} value={F.minRoic} placeholder="—"
                onChange={e => set('minRoic', e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} />
              %
            </label>
            <span className={labelCls}>
              <Tip text={TIP_GRADE}>등급</Tip>
              {([['all', '전체'], ['A', 'A'], ['AB', 'A·B']] as const).map(([k, l]) => (
                <button key={k} type="button" onClick={() => set('gradeF', k)}
                  className={`px-1.5 rounded ${F.gradeF === k ? 'bg-blue-500 text-white' : 'hover:text-gray-700 dark:hover:text-gray-200'}`}>{l}</button>
              ))}
            </span>
            <label className={labelCls}>
              <Tip text={TIP_SCORE}>사업성 ≥</Tip>
              <input type="number" min={5} max={25} value={F.minScore} placeholder="—"
                onChange={e => set('minScore', e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} />
              /25
            </label>
            <label className={labelCls}>
              <Tip text={TIP_SUB}>세부</Tip>
              <select value={subKey} onChange={e => setSubKey(e.target.value as SubKey)}
                className="bg-transparent text-gray-900 dark:text-white focus:outline-none">
                {(Object.keys(SUB_LABEL) as SubKey[]).map(k => <option key={k} value={k}>{SUB_LABEL[k]}</option>)}
              </select>
              ≥
              <input type="number" min={1} max={5} value={F.subMins[subKey] ?? ''} placeholder="—"
                onChange={e => { const v = e.target.value; setF(p => { const m = { ...p.subMins }; if (v === '') delete m[subKey]; else m[subKey] = Number(v); return { ...p, subMins: m } }) }}
                className={inputCls} />
              /5
            </label>
            {(Object.entries(F.subMins) as [SubKey, number][]).filter(([, v]) => v != null).map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1 text-xs rounded-lg px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                {SUB_LABEL[k]} ≥ {v}
                <button type="button" onClick={() => setF(p => { const m = { ...p.subMins }; delete m[k]; return { ...p, subMins: m } })}
                  className="text-blue-400 hover:text-red-500 leading-none">×</button>
              </span>
            ))}
            <label className={labelCls}>
              <Tip text={TIP_GROUP}>지금 상황</Tip>
              <select value={F.groupF} onChange={e => set('groupF', e.target.value as 'all' | GroupKey)}
                className="bg-transparent text-gray-900 dark:text-white focus:outline-none">
                <option value="all">전체</option>
                {(Object.keys(GROUPS) as GroupKey[]).map(k => <option key={k} value={k}>{GROUPS[k].short}</option>)}
              </select>
            </label>
            <label className={labelCls}>
              <Tip text={TIP_FAIR}>적정가 대비 ≤</Tip>
              <input type="number" min={-90} max={300} value={F.maxFairGap} placeholder="—"
                onChange={e => set('maxFairGap', e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} />
              %
            </label>
            <button onClick={() => set('excludeEtf', !F.excludeEtf)}
              className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
                F.excludeEtf
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
              }`}>
              ETF 제외
            </button>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs font-medium text-blue-500 dark:text-blue-400">
                {rows.length < allRows.length ? `${rows.length} / ${allRows.length}개` : `${allRows.length}개`}
              </span>
              {hasFilter && (
                <button onClick={() => setF(DEFAULT_F)}
                  className="text-xs text-gray-400 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-500 transition-colors">
                  초기화
                </button>
              )}
            </div>
          </div>
        )
      })()}

      <div className="overflow-x-auto">
      <table className="text-sm">
        <thead>
          <tr className="text-xs text-gray-400 dark:text-gray-500">
            <th rowSpan={2} className="pb-1 pr-1 w-6" />
            <th className="text-left pb-1 pr-2" rowSpan={2}>종목</th>
            <th rowSpan={2} className={`text-right pb-1 pr-2 font-semibold text-gray-500 dark:text-gray-400 leading-tight cursor-pointer select-none ${colBg('fairGap')}`}
              onClick={() => handleSort('fairGap')}>
              적정가<br /><Tip text={TIP_FAIR} below>대비</Tip><SortIcon col="fairGap" />
            </th>
            <th colSpan={3} className="text-center pb-1 px-2 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold">
              절대 수익률 <span className="font-normal opacity-60">(배당 포함)</span>
            </th>
            <th colSpan={3} className="text-center pb-1 px-2 border-b border-l-2 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold">
              S&P 500 대비 초과수익
            </th>
            <th colSpan={5} className="text-center pb-1 px-2 border-b border-l-2 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold">
              사업의 질
            </th>
          </tr>
          <tr className="text-xs text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-gray-700">
            <SortTh col="cagrMn"  className="text-right py-1 pr-2 font-medium">최솟값</SortTh>
            <SortTh col="cagrMed" className="text-right py-1 pr-2 font-medium">중앙값</SortTh>
            <SortTh col="cagrMx"  className="text-right py-1 pr-2 font-medium">최댓값</SortTh>
            <SortTh col="diffMn"  className="text-right py-1 px-2 font-medium border-l-2 border-gray-200 dark:border-gray-700">최솟값</SortTh>
            <SortTh col="diffMed" className="text-right py-1 pr-2 font-medium">중앙값</SortTh>
            <SortTh col="diffMx"  className="text-right py-1 pr-2 font-medium">최댓값</SortTh>
            <th className="text-center py-1 px-2 font-medium whitespace-nowrap border-l-2 border-gray-200 dark:border-gray-700"><Tip text={TIP_GRADE} below>등급</Tip></th>
            <SortTh col="score" className="text-right py-1 pr-2 font-medium"><Tip text={TIP_SCORE} below>사업성</Tip></SortTh>
            <SortTh col="roe"  className="text-right py-1 pr-2 font-medium"><Tip text={TIP_ROE} below right>ROE</Tip></SortTh>
            <SortTh col="roic" className="text-right py-1 pr-2 font-medium"><Tip text={TIP_ROIC} below right>ROIC</Tip></SortTh>
            <th className="text-left py-1 font-medium whitespace-nowrap"><Tip text={TIP_GROUP} below right>지금 상황</Tip></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.length === 0 && (
            <tr>
              <td colSpan={14} className="py-8 text-center text-sm text-gray-400 dark:text-gray-600">
                조건에 맞는 종목이 없습니다
              </td>
            </tr>
          )}
          {rows.map(({ i, s, cagrMn, cagrMed, cagrMx, diffMn, diffMed, diffMx, roe, roic, score, q, group, fairGap }) => {
            const isActive = activeStock === i
            const isStarred = starred.has(s.key)
            return (
              <tr
                key={s.key}
                onClick={() => setActiveStock(i)}
                className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40 ${
                  isActive ? 'bg-blue-50/60 dark:bg-blue-900/10' : ''
                }`}
              >
                <td className="py-1.5 pr-1">
                  <button
                    onClick={e => toggleStar(s.key, e)}
                    className={`text-sm leading-none transition-colors ${
                      isStarred ? 'text-yellow-400' : 'text-gray-200 dark:text-gray-700 hover:text-yellow-300'
                    }`}
                  >
                    ★
                  </button>
                </td>
                <td className="py-1.5 pr-2">
                  <div className="group/name relative inline-flex items-baseline gap-1 max-w-[108px]">
                    <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">{s.data.ticker}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{s.data.name}</span>
                    {(() => {
                      const desc = (spDesc as any)[s.data.ticker]
                      return (
                        <div className="absolute bottom-full left-0 mb-1.5 z-50 w-64
                                        invisible group-hover/name:visible opacity-0 group-hover/name:opacity-100
                                        transition-opacity duration-150 pointer-events-none
                                        bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md px-2 py-2
                                        shadow-lg">
                          <p className="font-semibold mb-1">{s.data.ticker} · {desc?.name ?? s.data.name}</p>
                          {desc?.sector && <p className="text-gray-300 mb-0.5">섹터: {desc.sector}</p>}
                          {desc?.products && <p className="text-gray-400 leading-relaxed">{desc.products}</p>}
                          <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                        </div>
                      )
                    })()}
                  </div>
                </td>
                {/* 지금 가격: 적정가 대비 */}
                <td className={`py-1.5 pr-2 text-right tabular-nums whitespace-nowrap font-semibold ${fairGap == null ? 'text-gray-300 dark:text-gray-600' : fairGap < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'} ${colBg('fairGap')}`}>
                  {fairGap != null ? `${fairGap > 0 ? '+' : ''}${fairGap.toFixed(0)}%` : '—'}
                </td>
                {/* 절대 수익률 */}
                <td className={`py-1.5 pr-2 text-right tabular-nums ${cagrMn != null ? cagrTextColor(cagrMn, true) : 'text-gray-300 dark:text-gray-600'} ${colBg('cagrMn')}`}>
                  {cagrMn != null ? `${cagrMn.toFixed(1)}%` : '진행 중'}
                </td>
                <td className={`py-1.5 pr-2 text-right tabular-nums font-semibold ${cagrMed != null ? cagrTextColor(cagrMed, true) : 'text-gray-300 dark:text-gray-600'} ${colBg('cagrMed')}`}>
                  {cagrMed != null ? `${cagrMed.toFixed(1)}%` : '진행 중'}
                </td>
                <td className={`py-1.5 pr-2 text-right tabular-nums ${cagrMx != null ? cagrTextColor(cagrMx, true) : 'text-gray-300 dark:text-gray-600'} ${colBg('cagrMx')}`}>
                  {cagrMx != null ? `${cagrMx.toFixed(1)}%` : '진행 중'}
                </td>
                {/* S&P500 초과수익 */}
                <td className={`py-1.5 px-2 text-right tabular-nums border-l-2 border-gray-200 dark:border-gray-700 ${diffMn != null ? diffColor(diffMn) : 'text-gray-300'} ${colBg('diffMn')}`}>
                  {diffMn != null ? `${diffMn > 0 ? '+' : ''}${diffMn.toFixed(1)}pp` : '—'}
                </td>
                <td className={`py-1.5 pr-2 text-right tabular-nums font-semibold ${diffMed != null ? diffColor(diffMed) : 'text-gray-300'} ${colBg('diffMed')}`}>
                  {diffMed != null ? `${diffMed > 0 ? '+' : ''}${diffMed.toFixed(1)}pp` : '—'}
                </td>
                <td className={`py-1.5 pr-2 text-right tabular-nums ${diffMx != null ? diffColor(diffMx) : 'text-gray-300'} ${colBg('diffMx')}`}>
                  {diffMx != null ? `${diffMx > 0 ? '+' : ''}${diffMx.toFixed(1)}pp` : '—'}
                </td>
                {/* 사업의 질 */}
                <td className="py-1.5 px-2 text-center border-l-2 border-gray-200 dark:border-gray-700">
                  {q ? <span className={`text-[11px] px-1.5 py-0.5 rounded ${gradeColor(q.grade)}`}>{q.grade}</span> : <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>}
                </td>
                <td className={`py-1.5 pr-2 text-right tabular-nums ${score == null ? 'text-gray-300 dark:text-gray-600' : score >= 20 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-700 dark:text-gray-200'} ${colBg('score')}`}>
                  {score != null ? score : '—'}
                </td>
                <td className={`py-1.5 pr-2 text-right tabular-nums ${roe == null ? 'text-gray-300 dark:text-gray-600' : roe >= 20 ? 'text-emerald-600 dark:text-emerald-400' : roe < 8 ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'} ${colBg('roe')}`}>
                  {roe != null ? `${roe.toFixed(0)}%` : '—'}
                </td>
                <td className={`py-1.5 pr-2 text-right tabular-nums ${roic == null ? 'text-gray-300 dark:text-gray-600' : roic >= 20 ? 'text-emerald-600 dark:text-emerald-400' : roic < 8 ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'} ${colBg('roic')}`}>
                  {roic != null ? `${roic.toFixed(0)}%` : '—'}
                </td>
                <td className="py-1.5 whitespace-nowrap">
                  {group ? <span className={`text-[11px] px-1.5 py-0.5 rounded ${groupColor(group)}`}>{GROUPS[group].short}</span> : <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        행 클릭 시 상세 보기 · ★ 클릭으로 즐겨찾기 · 최근 15개 완결 구간 기준
      </p>
    </div>
  )
}

// ── 에르메스(RMS) 인사이트 (2026-10-21 분석, 정적 텍스트) ───────────
// ── 연도별 수익률 분해 (EPS 몫 + 배당 몫 + PER 몫) — 종목 인사이트 공통 ─────────
type Decomp = {
  buyYear: number; sellYear: number; peBuy: number; peSell: number
  epsGrowthCagr: number; peCagr: number; totalCagr: number; note?: string | null
  inProgress?: boolean; years?: number   // 진행 중 구간 (10년 미만, 현재가 기준)
}
type DivRow = { buyYear: number; priceCagr: number; totalCagr: number; divCagr: number }
type Shares = { eps: number; div: number | null; pe: number }

// 곱셈 관계 (1+수익률) = (1+EPS 성장)(1+배당)(1+순수 PER 변화)를 로그 비율로 배분 → 몫의 합 = 연평균 수익률
// epsDecomp의 PER은 배당 조정 주가 기준이라 배당이 섞여 있음 → 배당 데이터가 있으면 분리
function decompShares(d: Decomp, divCagr: number | null): Shares {
  const T = d.totalCagr
  const lt = Math.log(1 + T / 100)
  if (Math.abs(lt) < 1e-9) return { eps: 0, div: divCagr == null ? null : 0, pe: 0 }
  const part = (r: number) => T * Math.log(1 + r / 100) / lt
  const eps = part(d.epsGrowthCagr)
  if (divCagr == null) return { eps, div: null, pe: T - eps } // 배당 포함 PER 몫(나머지)
  const div = part(divCagr)
  return { eps, div, pe: T - eps - div }
}

// 완결 구간 + 진행 중 구간(9년 이상 경과, 메인 차트와 동일 기준)을 합친 분해 데이터
// 진행 중: 매수 EPS = 배당조정 매수가 ÷ 매수 PER, 현재 EPS·PER = 자동 갱신된 current 값
function buildDecomp(data: StockData): Decomp[] {
  const done = (((data as any).epsDecomp ?? []) as Decomp[])
  const c = data.current as { price?: number; eps?: number }
  if (!c?.price || !c?.eps || c.eps <= 0) return done
  const prog = (data.rows10y as any[])
    .filter(r => !r.isComplete && r.yearsActual >= 9 && r.peBuy && r.multiple > 0)
    .map(r => {
      const yrs = Math.log(r.multiple) / Math.log(1 + r.cagr / 100)
      const buyPrice = c.price! / r.multiple
      const epsBuy = buyPrice / r.peBuy
      const peSell = c.price! / c.eps!
      const peBuyShow = r.peBuyActual ?? r.peBuy // 실제 종가 기준 PER(있으면)
      return {
        buyYear: r.buyYear,
        sellYear: Number(String(r.sellDate).slice(0, 4)),
        peBuy: peBuyShow,
        peSell,
        epsGrowthCagr: (Math.pow(c.eps! / epsBuy, 1 / yrs) - 1) * 100,
        peCagr: (Math.pow(peSell / peBuyShow, 1 / yrs) - 1) * 100,
        totalCagr: r.cagr,
        note: null,
        inProgress: true,
        years: Math.round(yrs * 10) / 10,
      } as Decomp
    })
  return [...done, ...prog]
}

// 막대에 쌓을 칸: 막대 높이 = 연평균 수익률. PER 하락분은 막대 위 빨간 점선 칸
// 수익률이 마이너스면: 더해준 몫은 0 위, 깎은 몫은 0 아래에 쌓고 점으로 연평균 수익률 표시
function barParts(t: number, sh: Shares) {
  const div = sh.div ?? 0
  if (t < 0) return { eps: sh.eps, div, pe: sh.pe, cut: 0 }
  if (sh.pe >= 0) return { eps: sh.eps, div, pe: sh.pe, cut: 0 }
  const eps = Math.min(sh.eps, t)
  return { eps, div: Math.max(0, Math.min(div, t - eps)), pe: 0, cut: -sh.pe }
}

function DecompChart({ decomp, divMap }: { decomp: Decomp[]; divMap: Map<number, number> }) {
  const chartRef = useRef<ChartJS | null>(null)
  const [pluginLoaded, setPluginLoaded] = useState(false)
  useEffect(() => {
    import('chartjs-plugin-zoom').then(({ default: z }) => { ChartJS.register(z); setPluginLoaded(true) })
  }, [])

  const shares = decomp.map(d => decompShares(d, divMap.get(d.buyYear) ?? null))
  const parts = decomp.map((d, i) => barParts(d.totalCagr, shares[i]))
  const hasDiv = shares.some(sh => sh.div != null)
  const sgnPct = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`
  // 진행 중 구간은 옅게
  const fill = (rgb: string) => decomp.map(d => `rgba(${rgb},${d.inProgress ? 0.35 : 0.8})`)

  const chartData = {
    labels: decomp.map(d => d.inProgress ? `${d.buyYear}(진행)` : String(d.buyYear)),
    datasets: [
      { label: 'EPS 몫', data: parts.map(p => p.eps), backgroundColor: fill('16,185,129'), stack: 'ret' },
      ...(hasDiv ? [{ label: '배당 몫', data: parts.map(p => p.div), backgroundColor: fill('14,165,233'), stack: 'ret' }] : []),
      { label: hasDiv ? 'PER 몫' : 'PER 몫 (배당 포함)', data: parts.map(p => p.pe), backgroundColor: fill('168,85,247'), stack: 'ret' },
      ...(decomp.some(d => d.totalCagr < 0) ? [{
        type: 'line' as const,
        label: '연평균 수익률 (마이너스)',
        data: decomp.map(d => d.totalCagr < 0 ? d.totalCagr : null),
        borderColor: 'rgba(17,24,39,0.9)',
        backgroundColor: 'rgba(17,24,39,0.9)',
        showLine: false,
        pointRadius: 5,
        pointStyle: 'rectRot' as const,
      }] : []),
      {
        label: 'PER 하락으로 깎인 몫',
        data: parts.map(p => p.cut),
        backgroundColor: 'rgba(239,68,68,0.12)',
        borderColor: 'rgba(239,68,68,0.8)',
        borderWidth: 1,
        borderDash: [3, 3],
        stack: 'ret',
      },
    ],
  }

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 }, maxRotation: 45 } },
      y: { stacked: true, ticks: { font: { size: 11 }, callback: (v: number) => `${v}%` }, grid: { color: 'rgba(128,128,128,0.1)' } },
    },
    plugins: {
      legend: { position: 'top' as const, labels: { font: { size: 11 }, boxWidth: 12 } },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        filter: (item: any) => item.parsed.y !== 0,
        callbacks: {
          title: (items: any[]) => {
            const d = decomp[items[0].dataIndex]
            return d.inProgress
              ? `${d.buyYear} → 현재 (${d.years}년 경과, 진행 중) · 연평균 수익률 ${d.totalCagr.toFixed(1)}%`
              : `${d.buyYear} → ${d.sellYear} · 연평균 수익률 ${d.totalCagr.toFixed(1)}%`
          },
          label: (ctx: any) => {
            const d = decomp[ctx.dataIndex]
            const sh = shares[ctx.dataIndex]
            const name = ctx.dataset.label as string
            if (name === 'EPS 몫') return `EPS 몫 ${sgnPct(sh.eps)}%p (EPS 연 ${sgnPct(d.epsGrowthCagr)}% 성장)`
            if (name === '배당 몫') return `배당 몫 ${sgnPct(sh.div ?? 0)}%p`
            if (name.startsWith('연평균 수익률')) return `연평균 수익률 ${sgnPct(d.totalCagr)}%`
            if (name.startsWith('PER 몫')) return `${name} ${sgnPct(sh.pe)}%p (PER ${d.peBuy.toFixed(0)}배 → ${d.peSell.toFixed(0)}배)`
            return `PER 하락 ${sgnPct(sh.pe)}%p (PER ${d.peBuy.toFixed(0)}배 → ${d.peSell.toFixed(0)}배)`
          },
          afterBody: (items: any[]) => {
            const d = decomp[items[0].dataIndex]
            const out: string[] = []
            if (shares[items[0].dataIndex].div == null && hasDiv) out.push('배당 데이터 없음 → PER 몫에 배당 포함')
            if (d.note) out.push(`⚠ ${d.note}`)
            return out
          },
        },
      },
      zoom: pluginLoaded ? {
        pan: { enabled: true, mode: 'x' },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
      } : {},
    },
  }

  return (
    <div className="relative">
      <button
        onClick={() => (chartRef.current as any)?.resetZoom?.()}
        className="absolute top-0 right-0 z-10 px-2 py-0.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded"
      >
        줌 초기화
      </button>
      <div style={{ height: 300 }}>
        <Chart ref={chartRef as any} type="bar" data={chartData} options={options} />
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">
        휠: 확대/축소 &nbsp;|&nbsp; 드래그: 이동
      </p>
    </div>
  )
}

// 차트 읽는 법 + 차트 + 표 + 계산 설명 묶음
function DecompSection({
  title, decomp, divRows, exampleYear, noDivNote,
}: {
  title: string
  decomp: Decomp[]
  divRows?: DivRow[]
  exampleYear: number
  noDivNote?: string   // 배당 데이터가 없는 구간 설명
}) {
  const p = 'text-xs leading-relaxed text-gray-600 dark:text-gray-300'
  const th = 'py-1.5 px-2 font-medium text-gray-400 dark:text-gray-500'
  const td = 'py-1.5 px-2 tabular-nums text-gray-700 dark:text-gray-200'
  const sgn = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`

  const sorted = [...decomp].sort((a, b) => a.buyYear - b.buyYear)
  const divMap = new Map((divRows ?? []).map(r => [r.buyYear, r.divCagr]))
  const hasDiv = divMap.size > 0
  const cutYears = sorted.filter(d => decompShares(d, divMap.get(d.buyYear) ?? null).pe < 0 && d.totalCagr >= 0).map(d => d.buyYear)
  const ex = sorted.find(d => d.buyYear === exampleYear) ?? sorted.filter(d => !d.inProgress)[0] ?? sorted[0]
  const exDiv = divMap.get(ex.buyYear) ?? null
  const exSh = decompShares(ex, exDiv)
  const exPurePe = exDiv != null ? ((1 + ex.peCagr / 100) / (1 + exDiv / 100) - 1) * 100 : ex.peCagr
  const divVals = [...divMap.values()]

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-2">
      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h4>
      <div className="rounded bg-gray-50 dark:bg-gray-800/50 p-3 space-y-1.5">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">차트 읽는 법</p>
        <ul className={`${p} list-disc pl-4 space-y-1`}>
          <li><b>막대 높이 = 연평균 수익률.</b> 그해 연말에 사서 10년 보유했을 때의 연평균 수익률(배당 재투자 포함)과 정확히 같다.</li>
          <li><b className="text-emerald-600 dark:text-emerald-400">초록 칸 = EPS 몫.</b> 회사 이익이 늘어서 생긴 수익.</li>
          {hasDiv && <li><b className="text-sky-600 dark:text-sky-400">하늘색 칸 = 배당 몫.</b> 받은 배당을 다시 투자해서 생긴 수익.</li>}
          <li><b className="text-purple-600 dark:text-purple-400">보라 칸 = PER 몫.</b> 시장이 같은 이익에 더 비싼 값을 매겨줘서 생긴 수익.
            예: {ex.buyYear}년 매수 연 {ex.totalCagr.toFixed(1)}% = EPS 몫 {exSh.eps.toFixed(1)}%p
            {exSh.div != null && <> + 배당 몫 {exSh.div.toFixed(1)}%p</>} + PER 몫 {exSh.pe.toFixed(1)}%p.</li>
          {cutYears.length > 0 && (
            <li><b className="text-red-500">빨간 점선 칸 = PER 하락으로 깎인 몫.</b> PER이 떨어진 해({cutYears.join('·')}년 매수)에만 있다.
              이때는 색칠된 막대 높이가 곧 연평균 수익률이고, 빨간 칸만큼 이익 성장과 배당을 PER 하락이 깎아 먹었다는 뜻이다.</li>
          )}
          {sorted.some(d => d.totalCagr < 0) && (
            <li><b>수익률이 마이너스인 경우</b>({sorted.filter(d => d.totalCagr < 0).map(d => `${d.buyYear}년`).join('·')} 매수): 0 위는 수익을 더해준 몫, 0 아래는 깎아 먹은 몫이고,
              <b> 검은 마름모 점</b>이 실제 연평균 수익률이다.</li>
          )}
          {sorted.some(d => d.inProgress) && (
            <li><b>옅은 막대 = 진행 중 구간.</b> 아직 10년이 안 된 매수({sorted.filter(d => d.inProgress).map(d => `${d.buyYear}년`).join('·')})를
              지금 주가·최근 1년 EPS 기준으로 계산했다. 경과 기간 기준 연평균이라 앞으로 바뀔 수 있다.</li>
          )}
          <li>막대를 누르거나 마우스를 올리면 나누기 전 원래 EPS 성장률과 PER 변화(예: {ex.peBuy.toFixed(0)}배 → {ex.peSell.toFixed(0)}배)도 함께 보인다.</li>
        </ul>
      </div>
      <DecompChart decomp={sorted} divMap={divMap} />
      <div className="overflow-x-auto">
        <table className="text-xs">
          <thead>
            <tr>
              <th className={`${th} text-left whitespace-nowrap`}>보유 구간</th>
              <th className={`${th} text-right whitespace-nowrap`}>연평균 수익률</th>
              <th className={`${th} text-right whitespace-nowrap`}>= EPS 몫</th>
              {hasDiv && <th className={`${th} text-right whitespace-nowrap`}>+ 배당 몫</th>}
              <th className={`${th} text-right whitespace-nowrap`}>+ PER 몫</th>
              <th className={`${th} text-right whitespace-nowrap`}>EPS 성장(연)</th>
              <th className={`${th} text-right whitespace-nowrap`}>PER 변화</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sorted.map(d => {
              const sh = decompShares(d, divMap.get(d.buyYear) ?? null)
              return (
                <tr key={d.buyYear} className={d.inProgress ? 'opacity-60 italic' : ''}>
                  <td className={`${td} whitespace-nowrap`}>
                    {d.inProgress ? `${d.buyYear} → 현재 (${d.years}년, 진행 중)` : `${d.buyYear} → ${d.sellYear}`}
                    {d.note && <span title={d.note} className="ml-1 text-amber-500 cursor-help">⚠</span>}
                  </td>
                  <td className={`${td} text-right font-semibold`}>{d.totalCagr.toFixed(1)}%</td>
                  <td className={`${td} text-right text-emerald-600 dark:text-emerald-400`}>{sgn(sh.eps)}%p</td>
                  {hasDiv && (
                    <td className={`${td} text-right text-sky-600 dark:text-sky-400`}>{sh.div != null ? `${sgn(sh.div)}%p` : '—'}</td>
                  )}
                  <td className={`${td} text-right ${sh.pe >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-500'}`}>
                    {sgn(sh.pe)}%p{hasDiv && sh.div == null ? '*' : ''}
                  </td>
                  <td className={`${td} text-right text-gray-500 dark:text-gray-400`}>{sgn(d.epsGrowthCagr)}%</td>
                  <td className={`${td} text-right whitespace-nowrap text-gray-500 dark:text-gray-400`}>{d.peBuy.toFixed(0)}배 → {d.peSell.toFixed(0)}배</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {hasDiv && noDivNote && <p className="text-xs text-gray-400 dark:text-gray-500">* {noDivNote}</p>}
      {sorted.some(d => d.inProgress) && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          진행 중 구간의 현재 EPS·PER은 페이지 데이터에 자동 갱신되는 값(Yahoo Finance 최근 1년 EPS)을 썼다.
        </p>
      )}
      <div className="rounded bg-gray-50 dark:bg-gray-800/50 p-3 space-y-1.5">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">어떻게 나눴나</p>
        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
          <b>① 실제 관계는 덧셈이 아니라 곱셈이다.</b> 주가 = EPS × PER 이고 배당은 재투자되므로
          (1 + 연평균 수익률) = (1 + EPS 성장률) × (1 + PER 변화율){hasDiv && ' × (1 + 배당 효과)'}.
          예: {ex.buyYear}년 매수는 EPS 연 {ex.epsGrowthCagr.toFixed(1)}% 성장
          {exDiv != null ? <>, 배당 연 {exDiv.toFixed(1)}%, PER 연 {exPurePe.toFixed(1)}% 변화 → {(1 + ex.epsGrowthCagr / 100).toFixed(3)} × {(1 + exDiv / 100).toFixed(3)} × {(1 + exPurePe / 100).toFixed(3)}</>
            : <>, PER 연 {ex.peCagr.toFixed(1)}% 변화 → {(1 + ex.epsGrowthCagr / 100).toFixed(3)} × {(1 + ex.peCagr / 100).toFixed(3)}</>}
          {' '}= {(1 + ex.totalCagr / 100).toFixed(3)} → 연 {ex.totalCagr.toFixed(1)}%.
          그냥 더하면 {(ex.epsGrowthCagr + ex.peCagr).toFixed(1)}%로 조금 모자란다(서로 곱해지며 붙는 몫).
        </p>
        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
          <b>② 막대에서는 그 차이를 각 칸에 비율대로 나눠 담았다.</b> 그래서 칸을 모두 더하면 정확히 연평균 수익률과 같다.
          표의 &lsquo;EPS 성장(연)&rsquo;은 나누기 전 원래 이익 성장률이다.
        </p>
        {hasDiv ? (
          <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
            <b>③ 배당은 따로 뺐다.</b> 배당을 뺀 주가와 배당을 재투자한 주가(Yahoo Finance)의 10년 상승률 차이로 배당 몫을 계산했다
            (연 {Math.min(...divVals).toFixed(1)}~{Math.max(...divVals).toFixed(1)}%). 보라 칸은 배당을 뺀 순수한 PER 변화다.
          </p>
        ) : (
          <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
            <b>③ PER 몫에는 배당이 들어 있다.</b> 수익률과 PER을 모두 배당을 반영해 조정한 주가로 계산했기 때문이다.
          </p>
        )}
      </div>
    </div>
  )
}

// ── 에르메스 장기 데이터: 자산가 인구 · 매출 성장 · 가격 인상 · 판매량(역산) ─────────
// 자산가: Capgemini 세계 부 보고서(금융자산 100만 달러 이상, 각 연도판 발표값; 2003·2004년은 미확인 근사)
// 에르메스 매출 성장(환율 제외): ok=true는 회사 발표 확인, false는 근사값
// 가격: 회사·전문 매체가 전한 연간 평균 인상률 근사(대표 제품 기준 포함)
const HERMES_HISTORY: Array<{
  y: number; hnwi: number | null; hnwiG: number | null
  rev: number | null; revOk?: boolean; price: number | null; priceNote?: string
}> = [
  { y: 2002, hnwi: 7.3, hnwiG: 2.1, rev: null, price: null },
  { y: 2003, hnwi: 7.7, hnwiG: 7.5, rev: null, price: null },
  { y: 2004, hnwi: 8.3, hnwiG: 7.3, rev: null, price: null },
  { y: 2005, hnwi: 8.7, hnwiG: 6.5, rev: null, price: null },
  { y: 2006, hnwi: 9.5, hnwiG: 8.3, rev: null, price: null },
  { y: 2007, hnwi: 10.1, hnwiG: 6.0, rev: null, price: null },
  { y: 2008, hnwi: 8.6, hnwiG: -14.9, rev: null, price: null },
  { y: 2009, hnwi: 10.0, hnwiG: 17.1, rev: null, price: null },
  { y: 2010, hnwi: 10.9, hnwiG: 8.3, rev: 19, revOk: false, price: null },
  { y: 2011, hnwi: 11.0, hnwiG: 0.8, rev: 18, revOk: false, price: null },
  { y: 2012, hnwi: 12.0, hnwiG: 9.2, rev: 13, revOk: false, price: null },
  { y: 2013, hnwi: 13.7, hnwiG: 14.7, rev: 13, revOk: true, price: null },
  { y: 2014, hnwi: 14.6, hnwiG: 6.7, rev: 10, revOk: false, price: null },
  { y: 2015, hnwi: 15.4, hnwiG: 4.9, rev: 8, revOk: false, price: null },
  { y: 2016, hnwi: 16.5, hnwiG: 7.5, rev: 7.5, revOk: false, price: null },
  { y: 2017, hnwi: 18.1, hnwiG: 9.5, rev: 8.6, revOk: false, price: null },
  { y: 2018, hnwi: 18.0, hnwiG: -0.3, rev: 10, revOk: false, price: null },
  { y: 2019, hnwi: 19.6, hnwiG: 8.8, rev: 12, revOk: true, price: 2.0, priceNote: '버킨30 유럽 €7,400→7,550' },
  { y: 2020, hnwi: 20.8, hnwiG: 6.3, rev: -6, revOk: false, price: 2.7, priceNote: '버킨30 유럽 €7,550→7,750' },
  { y: 2021, hnwi: 22.5, hnwiG: 7.8, rev: 42, revOk: false, price: 3.0, priceNote: '근사' },
  { y: 2022, hnwi: 21.7, hnwiG: -3.3, rev: 23, revOk: false, price: 4.0, priceNote: '2~5%' },
  { y: 2023, hnwi: 22.8, hnwiG: 5.1, rev: 21, revOk: true, price: 7.0, priceNote: '5~10% (유럽 가방 8~10%)' },
  { y: 2024, hnwi: 23.4, hnwiG: 2.6, rev: 15, revOk: true, price: 7.0, priceNote: '평균 약 7%' },
  { y: 2025, hnwi: 25.3, hnwiG: 7.9, rev: 9, revOk: true, price: 6.5, priceNote: '6~7% (+미국 관세분 5%)' },
  { y: 2026, hnwi: null, hnwiG: null, rev: 6, revOk: true, price: 5.5, priceNote: 'CFO 5~6% (상반기 매출 기준)' },
]

function HermesHistory() {
  const rows = HERMES_HISTORY
  const vol = (r: typeof rows[number]) =>
    r.rev != null && r.price != null ? ((1 + r.rev / 100) / (1 + r.price / 100) - 1) * 100 : null
  const th = 'py-1.5 px-2 font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap'
  const td = 'py-1 px-2 tabular-nums text-gray-700 dark:text-gray-200 whitespace-nowrap'
  const sg = (v: number | null, d = 1) => (v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(d)}%`)

  const chartRows = rows.filter(r => r.y >= 2010)
  const chartData = {
    labels: chartRows.map(r => (r.y === 2026 ? '2026상' : String(r.y))),
    datasets: [
      { type: 'bar' as const, label: '에르메스 매출 성장(환율 제외)', data: chartRows.map(r => r.rev), backgroundColor: 'rgba(249,115,22,0.55)', order: 2 },
      { type: 'line' as const, label: '자산가 인구 증가율', data: chartRows.map(r => r.hnwiG), borderColor: 'rgba(16,185,129,0.9)', backgroundColor: 'rgba(16,185,129,0.9)', pointRadius: 3, borderWidth: 2, order: 1, spanGaps: false },
      { type: 'line' as const, label: '가격 인상률', data: chartRows.map(r => r.price), borderColor: 'rgba(168,85,247,0.9)', backgroundColor: 'rgba(168,85,247,0.9)', pointRadius: 3, borderWidth: 2, borderDash: [4, 3], order: 0, spanGaps: false },
    ],
  }
  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45 } },
      y: { ticks: { font: { size: 11 }, callback: (v: number) => `${v}%` }, grid: { color: 'rgba(128,128,128,0.1)' } },
    },
    plugins: {
      legend: { position: 'top' as const, labels: { font: { size: 11 }, boxWidth: 12 } },
      tooltip: { callbacks: { label: (c: any) => c.parsed.y == null ? '' : `${c.dataset.label}: ${c.parsed.y > 0 ? '+' : ''}${c.parsed.y}%` } },
    },
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">장기 데이터: 자산가 인구 · 에르메스 매출 · 가격 · 판매량 (2002~2026)</p>
      <div style={{ height: 260 }}>
        <Chart type="bar" data={chartData} options={options} />
      </div>

      <div className="grid sm:grid-cols-3 gap-2">
        <StatCard label="자산가 인구 (2002→2025)" value="730만 → 2,530만, 연 5.6%" />
        <StatCard label="버킨 가격 (미국, 2000→2025)" value="약 4,000 → 14,900달러, 연 약 5.4%" />
        <StatCard label="에르메스 매출 (2010→2025, 환율 제외)" value="연 약 13%" />
      </div>

      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="text-xs">
          <thead className="sticky top-0 bg-white dark:bg-gray-950">
            <tr>
              <th className={`${th} text-left`}>연도</th>
              <th className={`${th} text-right`}>자산가(백만 명)</th>
              <th className={`${th} text-right`}>자산가 증가</th>
              <th className={`${th} text-right`}>매출 성장(환율 제외)</th>
              <th className={`${th} text-right`}>가격 인상</th>
              <th className={`${th} text-right`}>판매량·구성(역산)</th>
              <th className={`${th} text-left`}>가격 근거</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {[...rows].reverse().map(r => (
              <tr key={r.y}>
                <td className={td}>{r.y === 2026 ? '2026 상반기' : r.y}</td>
                <td className={`${td} text-right`}>{r.hnwi != null ? r.hnwi.toFixed(1) : '—'}</td>
                <td className={`${td} text-right ${r.hnwiG != null && r.hnwiG < 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{sg(r.hnwiG)}</td>
                <td className={`${td} text-right ${r.rev != null && r.rev < 0 ? 'text-red-500' : ''}`}>
                  {sg(r.rev, r.rev != null && r.rev % 1 ? 1 : 0)}{r.rev != null && !r.revOk ? '*' : ''}
                </td>
                <td className={`${td} text-right text-purple-600 dark:text-purple-400`}>{sg(r.price)}</td>
                <td className={`${td} text-right font-semibold`}>{sg(vol(r))}</td>
                <td className={`${td} text-gray-400`}>{r.priceNote ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="text-xs leading-relaxed text-gray-600 dark:text-gray-300 list-disc pl-4 space-y-1">
        <li><b>2021~2023년은 예외적인 호황.</b> 코로나 이후 보복 소비로 판매량이 연 13~38% 늘었다. 이 시기의 높은 성장과 PER(45~66배)을 기준으로 삼으면 기대가 과해진다.</li>
      </ul>
      <p className="text-[11px] text-gray-400 dark:text-gray-500">
        * 표시는 근사값(회사 발표로 다시 확인하지 못함). 2010~2018년 가격 인상률은 연도별 자료를 찾지 못해 비워 뒀다 — 장기로는 버킨 가격이 연 5~7%(달러 기준, 환율 포함) 올랐다.
        자산가 수는 Capgemini 각 연도판 발표값이라 이후 개정과 조금 다를 수 있다. 판매량·구성 = (1+매출 성장)÷(1+가격 인상)−1.
      </p>
    </div>
  )
}

// ── 에르메스 EPS 증가율 분해: 가격 몫 + 판매량 몫 + 이익률·환율·기타 몫 (연도별) ─────────
const HERMES_EPS: Record<number, number> = { 2018: 13.48, 2019: 14.66, 2020: 13.27, 2021: 23.37, 2022: 32.2, 2023: 41.19, 2024: 43.93, 2025: 43.15 }

function HermesEpsQP() {
  // 2026 상반기: 주당이익 21.36 vs 21.43(전년 상반기)
  const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]
  const rows = years.map(y => {
    const h = HERMES_HISTORY.find(r => r.y === y)!
    const eps = y === 2026 ? (21.36 / 21.43 - 1) * 100 : (HERMES_EPS[y] / HERMES_EPS[y - 1] - 1) * 100
    const p = h.price ?? 0
    const rev = h.rev ?? 0
    const v = ((1 + rev / 100) / (1 + p / 100) - 1) * 100
    // 곱셈 관계를 로그 비율로 배분 → 세 몫의 합 = EPS 증가율
    const lt = Math.log(1 + eps / 100)
    const part = (r: number) => (Math.abs(lt) < 1e-6 ? r : eps * Math.log(1 + r / 100) / lt)
    const ps = part(p), vs = part(v)
    return { y, eps, p, v, rev, hnwiG: h.hnwiG, ps, vs, os: eps - ps - vs }
  })
  const sg = (x: number) => `${x > 0 ? '+' : ''}${x.toFixed(1)}`

  const chartData = {
    labels: rows.map(r => (r.y === 2026 ? '2026상' : String(r.y))),
    datasets: [
      { type: 'bar' as const, label: '가격 몫(P)', data: rows.map(r => r.ps), backgroundColor: 'rgba(168,85,247,0.8)', stack: 'eps', order: 2 },
      { type: 'bar' as const, label: '판매량 몫(Q)', data: rows.map(r => r.vs), backgroundColor: 'rgba(16,185,129,0.8)', stack: 'eps', order: 2 },
      { type: 'bar' as const, label: '이익률·환율·기타 몫', data: rows.map(r => r.os), backgroundColor: 'rgba(148,163,184,0.7)', stack: 'eps', order: 2 },
      { type: 'line' as const, label: 'EPS 증가율(합계)', data: rows.map(r => r.eps), borderColor: 'rgba(17,24,39,0.9)', backgroundColor: 'rgba(17,24,39,0.9)', showLine: false, pointRadius: 5, pointStyle: 'rectRot' as const, order: 0 },
      { type: 'line' as const, label: '자산가 인구 증가율', data: rows.map(r => r.hnwiG), borderColor: 'rgba(234,88,12,0.9)', backgroundColor: 'rgba(234,88,12,0.9)', borderDash: [4, 3], pointRadius: 3, borderWidth: 2, order: 1, spanGaps: false },
    ],
  }
  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { stacked: true, ticks: { font: { size: 11 }, callback: (v: number) => `${v}%` }, grid: { color: 'rgba(128,128,128,0.1)' } },
    },
    plugins: {
      legend: { position: 'top' as const, labels: { font: { size: 11 }, boxWidth: 12 } },
      tooltip: {
        mode: 'index' as const, intersect: false,
        callbacks: {
          label: (c: any) => {
            const r = rows[c.dataIndex]
            const l = c.dataset.label as string
            if (l.startsWith('가격')) return `가격 몫 ${sg(r.ps)}%p (가격 인상 ${sg(r.p)}%)`
            if (l.startsWith('판매량')) return `판매량 몫 ${sg(r.vs)}%p (판매량 ${sg(r.v)}%)`
            if (l.startsWith('이익률')) return `이익률·환율·기타 몫 ${sg(r.os)}%p`
            if (l.startsWith('EPS')) return `EPS 증가율 ${sg(r.eps)}%`
            return c.parsed.y == null ? '' : `자산가 인구 ${sg(c.parsed.y)}%`
          },
        },
      },
    },
  }
  const th = 'py-1.5 px-2 font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap'
  const td = 'py-1 px-2 tabular-nums text-gray-700 dark:text-gray-200 whitespace-nowrap'

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">EPS 증가율을 쪼개 보기 — 막대 하나 = 가격 몫 + 판매량 몫 + 이익률·환율·기타 몫 (연도별)</p>
      <div className="rounded bg-gray-50 dark:bg-gray-800/50 p-3">
        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
          위 3번 차트는 <b>주가 수익률 = EPS 몫 + 배당 몫 + PER 몫</b>이었다. 여기서는 그중 <b>EPS 몫을 한 번 더</b> 쪼갠다:
          EPS 증가율 ≈ <b className="text-purple-600 dark:text-purple-400">가격 인상(P)</b> × <b className="text-emerald-600 dark:text-emerald-400">판매량 증가(Q)</b> × 이익률·환율·기타.
          <b className="text-orange-600"> 주황 점선</b>은 자산가 인구 증가율 — 초록 칸(판매량)이 주황 선을 따라가면 &lsquo;고객층이 느는 만큼 판다&rsquo;는 뜻이다.
          <b> 검은 마름모</b>가 그해 실제 EPS 증가율(세 칸의 합)이다.
        </p>
      </div>
      <div style={{ height: 300 }}>
        <Chart type="bar" data={chartData} options={options} />
      </div>
      <div className="overflow-x-auto">
        <table className="text-xs">
          <thead>
            <tr>
              <th className={`${th} text-left`}>연도</th>
              <th className={`${th} text-right`}>EPS 증가</th>
              <th className={`${th} text-right`}>= 가격 몫</th>
              <th className={`${th} text-right`}>+ 판매량 몫</th>
              <th className={`${th} text-right`}>+ 이익률·환율·기타</th>
              <th className={`${th} text-right`}>자산가 인구</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map(r => (
              <tr key={r.y}>
                <td className={td}>{r.y === 2026 ? '2026 상반기' : r.y}</td>
                <td className={`${td} text-right font-semibold`}>{sg(r.eps)}%</td>
                <td className={`${td} text-right text-purple-600 dark:text-purple-400`}>{sg(r.ps)}%p</td>
                <td className={`${td} text-right text-emerald-600 dark:text-emerald-400`}>{sg(r.vs)}%p</td>
                <td className={`${td} text-right ${r.os < 0 ? 'text-red-500' : 'text-gray-500'}`}>{sg(r.os)}%p</td>
                <td className={`${td} text-right text-orange-600`}>{r.hnwiG != null ? `${sg(r.hnwiG)}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="text-xs leading-relaxed text-gray-600 dark:text-gray-300 list-disc pl-4 space-y-1">
        <li><b>가격 몫(보라)</b>은 매년 +2~8%p로 꾸준하고, <b>판매량 몫(초록)</b>은 해마다 들쭉날쭉하다.</li>
        <li><b>회색 칸(이익률·환율·기타)</b>은 2024년(-8%p)·2025년(-10%p)·2026년 상반기(-6%p)에 크게 마이너스다. 2024년은 환율(보고 매출 +13% vs 환율 제외 +15%)과 영업이익률 하락, 2025년·2026년 상반기는 프랑스 대기업 특별 법인세(2025년 EPS -1.8%)가 이익을 깎았다. 2021~2022년은 반대로 이익률 상승이 크게 더해졌다(+13~30%p).</li>
      </ul>
      <p className="text-[11px] text-gray-400 dark:text-gray-500">
        EPS는 연간(유로, 보고 기준), 매출 성장은 환율 제외 기준이라 환율 효과는 회색 칸에 들어간다. 2026년은 상반기 전년 대비. 세 칸은 곱셈 관계를 로그 비율로 나눠 합이 정확히 EPS 증가율이 되게 했다.
        가격 인상률은 근사값이라 판매량 몫도 근사다. EPS는 회사 발표 기준(2019·2021~2025년 주당이익, 그 외 순이익÷주식 수).
      </p>
    </div>
  )
}

// ── 에르메스: 고객 수(Q) × 가격(P)으로 본 성장 추정 ─────────
// ── 7·2번: 이익 성장 예측(4가지 요인) + 이익 시계(적정가 선 vs 주가) ─────────
// EPS 성장 = (1+판매량)(1+가격)(1+이익률 변화)(1+기타) − 1
type Factors = { q: number; pr: number; mg: number; ot: number }
const epsGrowthOf = (f: Factors) =>
  ((1 + f.q / 100) * (1 + f.pr / 100) * (1 + f.mg / 100) * (1 + f.ot / 100) - 1) * 100

const HERMES_SCENARIOS: Array<{ label: string; f: Factors; desc: string }> = [
  { label: '기본', f: { q: 4, pr: 5.5, mg: 0, ot: 0 }, desc: '판매량 = 직전 5년 자산가 증가율(물가 포함) 4%, 가격 = 회사 발표, 이익률 41% 유지' },
  { label: '낙관', f: { q: 6, pr: 6, mg: 1, ot: 0 }, desc: '판매량 = 장기 자산가 증가율 6%, 판매량이 빨라지며 이익률도 조금 상승' },
  { label: '지금 상태 지속', f: { q: 1, pr: 5.5, mg: 0, ot: 0 }, desc: '2026년 상반기처럼 판매량이 거의 멈추고 가격만 오름' },
]

function HermesForecast({ f, setF, peNow, peFair, past10 }: {
  f: Factors; setF: (f: Factors) => void; peNow: number
  peFair: number | null                                   // 2번 이익 시계 적정 PER 기본값(거품기 뺀 중간값)
  past10: { min: number; med: number; max: number } | null // 과거 10년 구간 EPS 성장률 분포 (3-3과 같은 값)
}) {
  const g = epsGrowthOf(f)
  const div = 1.35
  const ret = ((1 + g / 100) * (1 + div / 100) - 1) * 100 // PER 그대로일 때
  // PER이 적정 PER로 돌아갈 때 — 2번 이익 시계와 같은 계산(마지막 실적 시점부터 10년 뒤까지 성장)
  const [tNow] = useState(() => decYear(Date.now()))
  const yrs = tNow + 10 - RMS_ANCHORS[RMS_ANCHORS.length - 1][0]
  const retFair = peFair ? (Math.pow(Math.pow(1 + g / 100, yrs) * peFair / peNow, 0.1) * (1 + div / 100) - 1) * 100 : null

  const box = 'rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3'
  const p = 'text-xs leading-relaxed text-gray-600 dark:text-gray-300'
  const td = 'py-1.5 px-2 tabular-nums text-gray-700 dark:text-gray-200 whitespace-nowrap'
  const set = (k: keyof Factors) => (v: number) => setF({ ...f, [k]: v })
  const slider = (label: string, v: number, onSet: (n: number) => void, min: number, max: number, hint: string) => (
    <label className="block space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-gray-700 dark:text-gray-200">{label}</span>
        <span className="tabular-nums font-semibold text-gray-900 dark:text-white">{v > 0 ? '+' : ''}{v}%</span>
      </div>
      <input type="range" min={min} max={max} step={0.5} value={v} onChange={e => onSet(Number(e.target.value))} className="w-full accent-blue-600" />
      <p className="text-[11px] text-gray-400 dark:text-gray-500">{hint}</p>
    </label>
  )
  const past = [
    { k: '① 판매량', v: '+8.5%', note: '환율 뺀 매출 연 13.5% ÷ 가격 인상' },
    { k: '② 가격 인상', v: '+4.6%', note: '2019~2025년 평균 (그 이전은 기록 없음)' },
    { k: '③ 이익률 변화', v: '+3.4%', note: '영업이익률 24.2%(2009) → 41.0%(2025)' },
    { k: '④ 기타', v: '+1.3%', note: '환율 +0.6, 세금·이자 등 +0.7' },
  ]

  return (
    <>
      <div className={box}>
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">4-1. 앞으로 이익 성장 — 4가지 요인</h4>
        <p className={p}>
          <b>EPS 성장 = ① 판매량 × ② 가격 × ③ 이익률 × ④ 기타.</b> 회계상 이 넷 말고는 없다.
          어떤 사건(중국 경기, 관세, 코로나)이든 결국 이 넷 중 하나를 거쳐 이익에 들어온다.
        </p>

        <div className="overflow-x-auto">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">과거 16년(2009~2025) EPS 연 18.8%를 나누면</p>
          {past10 && <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">
            이익률 자료가 2009년부터라 이 구간으로 나눴다. 2009년은 2007~2009년 이익 정체 직후라 출발점이 낮아 18.8%가 높게 나온다.
            10년씩 끊어 보면 연 {past10.min.toFixed(0)}~{past10.max.toFixed(0)}%, 중간값 {past10.med.toFixed(1)}%다(3-3과 같은 값).
          </p>}
          <table className="text-xs">
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {past.map(r => (
                <tr key={r.k}><td className={td}>{r.k}</td><td className={`${td} text-right font-semibold`}>{r.v}</td><td className={`${td} text-gray-400 dark:text-gray-500`}>{r.note}</td></tr>
              ))}
              <tr className="bg-gray-50 dark:bg-gray-800/50"><td className={`${td} font-semibold`}>EPS 성장</td><td className={`${td} text-right font-semibold`}>+18.8%</td><td className={td}></td></tr>
            </tbody>
          </table>
        </div>

        <div className="rounded bg-amber-50 dark:bg-amber-900/10 p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">요인별 예측 방법 — 과거 점검에서 가장 잘 맞은 방식</p>
          <ul className={`${p} list-disc pl-4 space-y-1`}>
            <li>
              <b>① 판매량 = 자산가 수 증가율(물가 포함, 직전 5년).</b> 지금 값은 연 4.0%(2020→2025년 2,080만 → 2,530만 명).
              과거 7개 10년 구간(2009~2015년 시작)에서 매출을 예측해 보니 이 방식이 가장 잘 맞았다.
              <table className="text-xs my-1">
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  <tr className="font-semibold"><td className={td}>자산가 수 증가율 (물가 포함)</td><td className={`${td} text-right`}>평균 −1.6%p</td></tr>
                  <tr><td className={td}>공급 반·수요 반</td><td className={`${td} text-right`}>평균 −2.0%p</td></tr>
                  <tr><td className={td}>물가 뺀 자산가 증가율</td><td className={`${td} text-right`}>평균 −5.2%p</td></tr>
                </tbody>
              </table>
              이론상으로는 물가가 ②가격에도 들어 있어 두 번 세는 셈이다. 하지만 실제로는 그만큼을 새 시장(중국·중동)과 다른 브랜드 고객 흡수가 채워 왔다. 그래서 결과적으로 이 단순한 방식이 가장 정확했다.
            </li>
            <li><b>② 가격 = 회사 발표값.</b> 매년 초 인상률을 밝힌다(2026년 5~6%). 네 요인 중 가장 정확하게 알 수 있다.</li>
            <li><b>③ 이익률 = 판매량을 따라간다.</b> 공방·매장은 고정비라 판매량이 빨리 늘면 이익률이 오르고, 멈추면 이익률도 멈춘다. 과거 연 +3.4%는 매출이 연 13~14% 크던 시기다. 지금은 41%로 최고 수준이라 기본은 0.</li>
            <li><b>④ 기타 = 0.</b> 환율·세금·이자는 길게 보면 서로 상쇄된다(과거 +1.3%).</li>
          </ul>
          <p className={p}>
            <b>한계:</b> 한 해 단위로는 맞지 않는다(2025년 자산가 +7.9%, 판매량 약 +2.5% — 중국과 &lsquo;열망 고객층&rsquo; 수요 둔화). 10년 평균으로만 쓰고, 답은 <b>중심값 ±3%p</b>로 본다.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">앞으로 — 버튼을 누르거나 직접 조절</p>
          <div className="grid sm:grid-cols-3 gap-2">
            {HERMES_SCENARIOS.map(sc => {
              const on = (Object.keys(sc.f) as (keyof Factors)[]).every(k => sc.f[k] === f[k])
              return (
                <button key={sc.label} onClick={() => setF(sc.f)}
                  className={`text-left rounded border p-2 transition-colors ${on ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'}`}>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">{sc.label} · EPS 연 {epsGrowthOf(sc.f).toFixed(1)}%</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{sc.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded bg-gray-50 dark:bg-gray-800/50 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">왜 과거(EPS 연 15~18%)보다 낮게 잡았나</p>
          <ul className={`${p} list-disc pl-4 space-y-1`}>
            <li><b>과거 EPS 성장 = 매출 성장 + 이익률 상승.</b> 2009~2025년 환율 뺀 매출은 연 13.5% 늘었고, 영업이익률이 24% → 41%로 오르며 해마다 약 3%p를 더 얹었다.</li>
            <li><b>이익률은 더 오르기 어렵다.</b> 41%는 명품 업계 최고 수준이라 앞으로는 이익률이 거의 그대로라고 본다. 그러면 EPS는 매출만큼 는다.</li>
            <li><b>최근 5년 연 24%는 코로나 반등이다.</b> 2020년 이익이 줄어든 바닥에서 출발한 숫자라 반복되기 어렵다.</li>
            <li><b>그래서 낙관 13.5% = 과거 16년 매출 성장(연 13.5%)이 그대로 다시 오는 경우.</b> 지금 판매량이 거의 멈춘(연 0~1%) 상황에서는 이것도 낙관이다. 15% 이상은 매출이 과거보다 빨라지거나 이익률이 41%보다 더 올라야 나온다.</li>
          </ul>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
          {slider('① 판매량', f.q, set('q'), -3, 10, '기본 = 직전 5년 자산가 증가율 4.0% · 장기(2009~2025) 6.0% · 2026년 상반기 실제 0~1%')}
          {slider('② 가격 인상', f.pr, set('pr'), 0, 10, '회사 발표값. 2023~2025년 6~7%, 2026년 5~6%')}
          {slider('③ 이익률 변화 (연)', f.mg, set('mg'), -3, 3, '판매량이 빠르면 +, 멈추면 0. 과거 연 +3.4%, 지금 41%로 최고 수준')}
          {slider('④ 기타', f.ot, set('ot'), -2, 2, '과거 16년 연 +1.3%(환율·세금·이자). 앞으로는 0으로 본다')}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <StatCard label="예상 EPS 성장 (연)" value={`${g.toFixed(1)}% (±3%p)`} />
          <StatCard label={`PER 그대로(${peNow.toFixed(1)}배)일 때 10년 수익률`} value={`연 ${ret.toFixed(1)}%`} />
          {retFair != null && <StatCard label={`PER ${peFair}배(거품기 뺀 중간값)로 돌아갈 때`} value={`연 ${retFair.toFixed(1)}%`} />}
        </div>
        <p className="text-[11px] text-gray-400 dark:text-gray-500">
          PER 그대로 = EPS 성장 + 배당 1.35%. 오른쪽 칸은 10년 뒤 PER이 2번 이익 시계의 기본 적정 PER({peFair ?? '—'}배)로 돌아간다고 본 값으로, 2번의 &lsquo;10년 뒤 적정가 선에 있으면&rsquo;과 같은 숫자다. 다른 PER은 2번 바나 4-2 표에서 본다.
        </p>

        <details className="rounded bg-gray-50 dark:bg-gray-800/50 p-3">
          <summary className="text-xs font-semibold text-gray-700 dark:text-gray-200 cursor-pointer">근거 자료 보기 (자산가 인구·가격 인상·연도별 매출·EPS 분해)</summary>
          <div className="space-y-3 mt-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded bg-gray-50 dark:bg-gray-800/50 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">자산가 수 (기관별, 물가 포함)</p>
          <table className="text-xs w-full">
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <tr><td className={td}>금융자산 100만 달러+ (Capgemini)</td><td className={`${td} text-right`}>1,540만(2015) → 2,530만(2025)</td><td className={`${td} text-right font-semibold`}>연 5.1%</td></tr>
              <tr><td className={td}>순자산 3천만 달러+ (Knight Frank)</td><td className={`${td} text-right`}>55.1만(2021) → 71.4만(2026)</td><td className={`${td} text-right font-semibold`}>연 5.3%</td></tr>
              <tr><td className={td}>2025년 한 해 (Capgemini 100만+)</td><td className={`${td} text-right`}>증시 호황</td><td className={`${td} text-right`}>+7.9%</td></tr>
              <tr><td className={td}>2025년 한 해 (UBS 달러 백만장자)</td><td className={`${td} text-right`}>약 100만 명 증가</td><td className={`${td} text-right`}>+1.5%</td></tr>
            </tbody>
          </table>
        </div>
        <div className="rounded bg-gray-50 dark:bg-gray-800/50 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">에르메스 연간 가격 인상률</p>
          <table className="text-xs w-full">
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <tr><td className={td}>2022년</td><td className={`${td} text-right`}>약 2~5%</td></tr>
              <tr><td className={td}>2023년</td><td className={`${td} text-right`}>5~10% (유럽 가방 8~10%)</td></tr>
              <tr><td className={td}>2024년</td><td className={`${td} text-right`}>평균 약 7%</td></tr>
              <tr><td className={td}>2025년</td><td className={`${td} text-right`}>6~7% (+미국 관세분 5%)</td></tr>
              <tr><td className={td}>2026년</td><td className={`${td} text-right`}>평균 5~6% (CFO), 버킨 7~9%</td></tr>
            </tbody>
          </table>
        </div>
      </div>

            <HermesHistory />
            <HermesEpsQP />
          </div>
        </details>
      </div>
    </>
  )
}

// ── 이익 시계(공용): 적정가 선 = 최근 1년 EPS × 적정 PER, 실제 주가와 비교 ─────────
const decYear = (ms: number) => {
  const d = new Date(ms)
  const y = d.getFullYear()
  const s = new Date(y, 0, 1).getTime()
  return y + (ms - s) / (new Date(y + 1, 0, 1).getTime() - s)
}
const quantile = (arr: number[], q: number) => {
  const a = [...arr].sort((x, y) => x - y)
  const i = (a.length - 1) * q
  const lo = Math.floor(i)
  return a[lo] + (a[Math.ceil(i)] - a[lo]) * (i - lo)
}
const SEC_Y = 365.25 * 86400

type ClockAnchor = [number, number] // [소수 연도, 최근 1년 EPS]

// 실적 구간: 둘 다 양수면 로그 보간(성장률 기준), 아니면 직선 보간. 마지막 실적 이후: 성장률 g로 연장
function makeEpsAt(anchors: ClockAnchor[], g: number) {
  const last = anchors[anchors.length - 1]
  return (t: number): number | null => {
    if (!anchors.length || t < anchors[0][0]) return null
    if (t >= last[0]) return last[1] > 0 ? last[1] * Math.pow(1 + g / 100, t - last[0]) : null
    for (let i = 1; i < anchors.length; i++) {
      const [t1, e1] = anchors[i]
      if (t <= t1) {
        const [t0, e0] = anchors[i - 1]
        const w = (t - t0) / (t1 - t0)
        return e0 > 0 && e1 > 0 ? Math.exp(Math.log(e0) * (1 - w) + Math.log(e1) * w) : e0 + (e1 - e0) * w
      }
    }
    return last[1]
  }
}

type ClockProps = {
  cur: string                                  // '€' | '$'
  anchors: ClockAnchor[]
  monthly: Array<{ t: number; price: number }>
  last: { date: string; close: number }
  g: number
  sharesOut: number | null                     // 회사 유통 주식 수 (없으면 회사 전체 숫자 생략)
  divYield: number
  storageKey: string
  growthBar?: ReactNode                        // EPS 성장률 바 (차트 아래, 적정 PER 바 위에 함께 표시)
  extraLive?: (now: number, fairNow: number) => ReactNode
  notes: string
  peExclude?: { from: number; to: number; label: string } // 이 기간을 뺀 PER 중간값도 눈금으로 (예: 거품기)
  fcfPs?: number | null                        // 최근 1년 주당 잉여현금흐름 (있으면 '내 몫 잉여현금' 표시)
}

// 초마다 바뀌는 숫자만 따로 다시 그림 (그래프는 그대로)
function ClockLive({ cur, epsAt, fairPe, shares, sharesOut, extraLive, fcfPs, dps }: {
  cur: string; epsAt: (t: number) => number | null; fairPe: number; shares: number; sharesOut: number | null
  extraLive?: (now: number, fairNow: number) => ReactNode
  fcfPs?: number | null; dps?: number | null
}) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 100); return () => clearInterval(id) }, [])
  const epsNow = epsAt(decYear(now)) ?? 0
  const fairNow = epsNow * fairPe
  const startOfYear = new Date(new Date(now).getFullYear(), 0, 1).getTime()
  const startOfDay = new Date(new Date(now).setHours(0, 0, 0, 0)).getTime()
  const money = (v: number, d = 0) => `${v < 0 ? '−' : ''}${cur}${Math.abs(v).toLocaleString('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d })}`
  const tile = 'rounded bg-white/70 dark:bg-gray-900/60 px-3 py-2.5'
  const lab = 'text-[11px] text-gray-500 dark:text-gray-400'
  const big = 'text-sm font-semibold tabular-nums text-gray-900 dark:text-white'
  const co = sharesOut ? epsNow * sharesOut : null
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div className={tile}><p className={lab}>적정가 (지금, 계속 오름)</p><p className={big}>{money(fairNow, 4)}</p></div>
        {co != null && <div className={tile}><p className={lab}>회사가 1초에 버는 순이익</p><p className={big}>{money(co / SEC_Y, 0)}</p></div>}
        {co != null && <div className={tile}><p className={lab}>올해 1월 1일부터 번 순이익</p><p className={big}>{money(co * (now - startOfYear) / 1000 / SEC_Y, 0)}</p></div>}
        <div className={tile}><p className={lab}>내 몫 이익: 1초</p><p className={big}>{money(epsNow * shares / SEC_Y, 7)}</p></div>
        <div className={tile}><p className={lab}>내 몫 이익: 오늘 0시부터</p><p className={big}>{money(epsNow * shares * (now - startOfDay) / 1000 / SEC_Y, 5)}</p></div>
        <div className={tile}><p className={lab}>내 몫 이익: 1년</p><p className={big}>{money(epsNow * shares, 2)}</p></div>
        {fcfPs != null && <div className={tile}><p className={lab}>내 몫 잉여현금: 1초</p><p className={big}>{money(fcfPs * shares / SEC_Y, 7)}</p></div>}
        {fcfPs != null && <div className={tile}><p className={lab}>내 몫 잉여현금: 1년</p><p className={big}>{money(fcfPs * shares, 2)}</p></div>}
        {dps != null && dps > 0 && <div className={tile}><p className={lab}>실제로 받는 배당: 1년</p><p className={big}>{money(dps * shares, 2)}</p></div>}
      </div>
      {fcfPs != null && (
        <p className="text-[11px] text-gray-500 dark:text-gray-400">
          이익 = 회계상 순이익. 잉여현금 = 사업에서 들어온 현금 − 설비투자로, 주인이 실제로 꺼내 쓸 수 있는 돈에 가깝다(최근 1년 값 고정).
          배당은 그중 회사가 실제로 나눠 준 돈이고, 나머지는 자사주 매입·현금 보유·인수에 쓰인다.
        </p>
      )}
      {extraLive?.(now, fairNow)}
    </>
  )
}

function ValueClockCore({ cur, anchors, monthly, last, g, sharesOut, divYield, storageKey, extraLive, notes, peExclude, fcfPs, growthBar }: ClockProps) {
  // 입력칸은 빈 값으로 시작(지우고 새로 입력 가능). 비어 있으면 1주로 계산
  const [sharesTxt, setSharesTxt] = useState('')
  const shares = Number(sharesTxt) > 0 ? Number(sharesTxt) : 1
  const [pePick, setPePick] = useState<number | null>(null)
  const chartRef = useRef<ChartJS | null>(null)
  const [pluginLoaded, setPluginLoaded] = useState(false)
  const [tNow] = useState(() => decYear(Date.now()))
  useEffect(() => {
    import('chartjs-plugin-zoom').then(({ default: z }) => { ChartJS.register(z); setPluginLoaded(true) })
    try { const v = Number(localStorage.getItem(storageKey)); if (v > 0) setSharesTxt(String(v)) } catch {}
  }, [storageKey])
  const saveShares = (txt: string) => {
    const t = txt.replace(/[^0-9.]/g, '')
    setSharesTxt(t)
    try { if (Number(t) > 0) localStorage.setItem(storageKey, t); else localStorage.removeItem(storageKey) } catch {}
  }

  const epsAt = makeEpsAt(anchors, g)
  const tStart = Math.max(anchors[0]?.[0] ?? 0, monthly[0]?.t ?? 0, tNow - 35)
  const hist = monthly.filter(r => r.t >= tStart).map(r => {
    const e = epsAt(r.t)
    return { t: r.t, price: r.price, pe: e && e > 0 ? r.price / e : null }
  })
  // 지난 20년(데이터가 짧으면 있는 만큼) 월별 PER 분포
  const tLastEps = anchors[anchors.length - 1][0]
  const peHist = hist.filter(r => r.t >= tLastEps - 20 && r.t <= tLastEps && r.pe != null && r.pe < 200).map(r => r.pe as number)
  const enough = peHist.length >= 24
  const peLo = enough ? quantile(peHist, 0.25) : null
  const peMid = enough ? quantile(peHist, 0.5) : null
  const peHi = enough ? quantile(peHist, 0.75) : null
  const yrsUsed = Math.round(peHist.length / 12)
  // 제외 구간(예: 거품기)이 있으면 그 구간을 뺀 중간값을 기본값으로
  const peExRest = enough && peExclude ? hist.filter(r => r.t >= tLastEps - 20 && r.t <= tLastEps && !(r.t >= peExclude.from && r.t < peExclude.to)
    && r.pe != null && r.pe > 0 && r.pe < 200).map(r => r.pe as number) : []
  const peExMid = peExRest.length >= 24 ? quantile(peExRest, 0.5) : null
  const fairPe = pePick ?? Math.round(peExMid ?? peMid ?? 20)
  const epsNow = epsAt(tNow) // 적정가용: 마지막 실적 이후는 성장률로 늘린 값
  const price = last.close
  // 지금 PER은 예측이 아니라 실제 최근 1년 EPS(마지막 발표 실적)로 계산
  const lastA = anchors[anchors.length - 1]
  const epsTtm = lastA && lastA[0] <= tNow ? lastA[1] : epsNow
  const peNow = epsTtm && epsTtm > 0 ? price / epsTtm : null
  // 적정 PER 바의 눈금: 20년 최소·중간값·평균·최대, 10년·5년 평균, 지금
  const peWin = (n: number) => hist.filter(r => r.t >= tLastEps - n && r.t <= tLastEps && r.pe != null && r.pe > 0 && r.pe < 200).map(r => r.pe as number)
  const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length
  const pe10 = peWin(10), pe5 = peWin(5)
  const peMarks: Array<{ k: string; short: string; v: number; c: string }> = []
  if (enough) {
    peMarks.push({ k: `${yrsUsed}년 최소`, short: '최소', v: Math.min(...peHist), c: 'bg-emerald-500 text-emerald-600 dark:text-emerald-400' })
    peMarks.push({ k: `${yrsUsed}년 중간값`, short: '중간', v: peMid!, c: 'bg-blue-600 text-blue-600 dark:text-blue-400' })
    peMarks.push({ k: `${yrsUsed}년 평균`, short: `${yrsUsed}년평균`, v: avg(peHist), c: 'bg-purple-500 text-purple-600 dark:text-purple-400' })
    peMarks.push({ k: `${yrsUsed}년 최대`, short: '최대', v: Math.max(...peHist), c: 'bg-red-500 text-red-500' })
    peMarks.push({ k: `${yrsUsed}년 하위 25%`, short: '하위25%', v: peLo!, c: 'bg-emerald-300 text-emerald-600 dark:text-emerald-400' })
    peMarks.push({ k: `${yrsUsed}년 상위 25%`, short: '상위25%', v: peHi!, c: 'bg-red-300 text-red-500' })
    if (peExclude && peExMid != null) peMarks.push({ k: peExclude.label, short: '거품 제외', v: peExMid, c: 'bg-amber-500 text-amber-600 dark:text-amber-400' })
  }
  if (pe10.length >= 24 && yrsUsed > 10) peMarks.push({ k: '10년 평균', short: '10년평균', v: avg(pe10), c: 'bg-gray-500 text-gray-500 dark:text-gray-400' })
  if (pe5.length >= 24) peMarks.push({ k: '5년 평균', short: '5년평균', v: avg(pe5), c: 'bg-gray-400 text-gray-500 dark:text-gray-400' })
  if (peNow != null && peNow > 0 && peNow < 200) peMarks.push({ k: '지금', short: '지금', v: peNow, c: 'bg-gray-900 dark:bg-white text-gray-900 dark:text-white' })
  const sMin = Math.max(1, Math.floor(Math.min(5, ...peMarks.map(m => m.v))))
  const sMax = Math.min(200, Math.ceil(Math.max(80, ...peMarks.map(m => m.v + 2))))
  const pctOf = (v: number) => (Math.min(sMax, Math.max(sMin, v)) - sMin) / (sMax - sMin)
  // 겹치지 않게 값 순서대로 3줄에 번갈아 배치
  const marksSorted = [...peMarks].sort((a, b) => a.v - b.v).map((m, i) => ({ ...m, row: i % 3 }))

  const fairNow = epsNow && epsNow > 0 ? epsNow * fairPe : null
  const gap = fairNow ? (price / fairNow - 1) * 100 : null
  const zone = peNow == null || peLo == null || peHi == null ? null
    : peNow < peLo ? { t: '싼 구간', c: 'text-emerald-600 dark:text-emerald-400' }
    : peNow > peHi ? { t: '비싼 구간', c: 'text-red-500' } : { t: '보통 구간', c: 'text-gray-700 dark:text-gray-200' }
  const e10 = epsAt(tNow + 10)
  const ret10 = e10 && e10 > 0 ? (Math.pow((e10 * fairPe) / price, 0.1) * (1 + divYield / 100) - 1) * 100 : null
  const fairPerDay = fairNow ? fairNow * Math.log(1 + g / 100) / 365.25 : null
  const money = (v: number, d = 0) => `${cur}${v.toLocaleString('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d })}`

  const grid: number[] = []
  for (let t = Math.ceil(tStart * 12) / 12; t <= tNow + 10; t += 1 / 12) grid.push(t)
  const line = (pe: number) => grid.map(t => { const e = epsAt(t); return { x: t, y: e && e > 0 ? e * pe : null } })
  const nowLine = {
    id: 'nowLine',
    afterDraw: (c: any) => {
      const x = c.scales.x.getPixelForValue(tNow)
      const { top, bottom } = c.chartArea
      const ctx = c.ctx
      ctx.save(); ctx.strokeStyle = 'rgba(107,114,128,0.6)'; ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke()
      ctx.setLineDash([]); ctx.fillStyle = 'rgba(107,114,128,0.9)'; ctx.font = '11px sans-serif'
      ctx.fillText('지금', x + 4, top + 12); ctx.restore()
    },
  }
  const chartData: any = {
    datasets: [
      ...(peLo != null && peHi != null ? [
        { label: `싼 구간 경계 (PER ${peLo.toFixed(0)}배)`, data: line(peLo), borderColor: 'rgba(16,185,129,0.5)', borderWidth: 1, pointRadius: 0, fill: false, spanGaps: false },
        { label: `비싼 구간 경계 (PER ${peHi.toFixed(0)}배)`, data: line(peHi), borderColor: 'rgba(239,68,68,0.5)', borderWidth: 1, pointRadius: 0, fill: '-1', backgroundColor: 'rgba(156,163,175,0.12)', spanGaps: false },
      ] : []),
      { label: `적정가 선 (EPS × ${fairPe}배)`, data: line(fairPe), borderColor: 'rgba(37,99,235,0.95)', borderWidth: 2, pointRadius: 0, fill: false, spanGaps: false,
        segment: { borderDash: (ctx: any) => (ctx.p0.parsed.x >= tLastEps ? [6, 4] : undefined) } },
      { label: '실제 주가 (월말)', data: hist.map(r => ({ x: r.t, y: r.price })), borderColor: 'rgba(17,24,39,0.85)', borderWidth: 1.5, pointRadius: 0, fill: false },
    ],
  }
  const ticks = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000]
  const options: any = {
    responsive: true, maintainAspectRatio: false, animation: false, parsing: false,
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
    scales: {
      x: { type: 'linear', min: Math.floor(tStart), max: Math.ceil(tNow + 10), ticks: { stepSize: 4, callback: (v: number) => String(Math.floor(v)), font: { size: 11 } }, grid: { color: 'rgba(128,128,128,0.08)' } },
      y: { type: 'logarithmic', ticks: { font: { size: 11 }, callback: (v: number) => (ticks.includes(v) ? `${cur}${v.toLocaleString()}` : '') }, grid: { color: 'rgba(128,128,128,0.08)' } },
    },
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 12 } },
      tooltip: {
        filter: (i: any) => i.parsed.y != null,
        callbacks: {
          title: (items: any[]) => { const x = items[0].parsed.x; return `${Math.floor(x)}년 ${Math.max(1, Math.round((x % 1) * 12))}월` },
          label: (c: any) => `${c.dataset.label}: ${cur}${Math.round(c.parsed.y).toLocaleString()}`,
        },
      },
      zoom: pluginLoaded ? { pan: { enabled: true, mode: 'x' }, zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' } } : {},
    },
  }

  const p = 'text-xs leading-relaxed text-gray-600 dark:text-gray-300'
  const tile = 'rounded bg-gray-50 dark:bg-gray-800/60 px-3 py-2.5'
  const lab = 'text-[11px] text-gray-500 dark:text-gray-400'
  const big = 'text-sm font-semibold tabular-nums text-gray-900 dark:text-white'

  if (!epsNow || epsNow <= 0) {
    return <p className={p}>최근 1년 이익이 적자라 적정가 선을 그릴 수 없다.</p>
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <button onClick={() => (chartRef.current as any)?.resetZoom?.()}
          className="absolute top-0 right-0 z-10 px-2 py-0.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded">줌 초기화</button>
        <div style={{ height: 320 }}>
          <Chart ref={chartRef as any} type="line" data={chartData} options={options} plugins={[nowLine]} />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">휠: 확대/축소 &nbsp;|&nbsp; 드래그: 이동</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className={tile}><p className={lab}>적정가 (지금)</p><p className={big}>{fairNow ? money(fairNow, 1) : '—'}</p></div>
        <div className={tile}><p className={lab}>주가 ({last.date})</p><p className={big}>{money(price, 1)}</p></div>
        <div className={tile}><p className={lab}>지금 PER{zone ? ' · 구간' : ''}</p><p className={`${big} ${zone?.c ?? ''}`}>{peNow ? `${peNow.toFixed(1)}배` : '—'}{zone ? ` · ${zone.t}` : ''}</p></div>
        <div className={tile}><p className={lab}>적정가 대비</p><p className={`${big} ${gap != null && gap < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>{gap != null ? `${gap > 0 ? '+' : ''}${gap.toFixed(1)}% ${gap < 0 ? '(쌈)' : '(비쌈)'}` : '—'}</p></div>
      </div>

      <p className={p}>
        <b>파란 선 = 적정가 = 최근 1년 EPS × 적정 PER.</b> 이익이 늘면 파란 선이 오른쪽 위로 올라가고, 정한 EPS 성장률(연 {g.toFixed(1)}%)로 10년 뒤까지 이어진다(점선).
        검은 선(주가)이 띠 아래면 싼 구간, 위면 비싼 구간이다.
        {peMid != null && <> 적정 PER 기본값은 {peExMid != null && peExclude ? <>{peExclude.label}({peExMid.toFixed(0)}배, 전체 {yrsUsed}년 중간값은 {peMid.toFixed(0)}배)</> : <>지난 {yrsUsed}년 PER의 중간값({peMid.toFixed(0)}배)</>}, 띠는 하위·상위 25%({peLo!.toFixed(0)}~{peHi!.toFixed(0)}배)다.</>}
      </p>

      <div className="rounded border border-gray-200 dark:border-gray-800 p-3 space-y-4">
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">조절 — 파란 선을 움직이는 두 가지</p>
      {growthBar}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="font-medium text-gray-700 dark:text-gray-200">적정 PER</span>
          <span className="tabular-nums font-semibold text-gray-900 dark:text-white">{fairPe}배</span>
        </div>
        <input type="range" min={sMin} max={sMax} step={1} value={fairPe} onChange={e => setPePick(Number(e.target.value))} className="w-full accent-blue-600" />
        {/* 눈금자: 바 아래 세로선 + 이름·배수 (손잡이 중심에 맞춤) */}
        {marksSorted.length > 0 && (
          <div className="relative h-14 -mt-1" aria-hidden>
            {marksSorted.map(m => {
              const pct = pctOf(m.v)
              const left = `calc(${(pct * 100).toFixed(2)}% + ${((0.5 - pct) * 16).toFixed(1)}px)`
              return (
                <div key={m.k} className="absolute top-0 flex flex-col items-center -translate-x-1/2" style={{ left }}>
                  <div className={`w-px ${m.c.split(' ')[0]}`} style={{ height: 6 + m.row * 14 }} />
                  <span className={`text-[10px] leading-none whitespace-nowrap tabular-nums ${m.c.split(' ').slice(1).join(' ')}`}>
                    {m.short} {m.v.toFixed(0)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
        {peMarks.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {peMarks.map(m => (
              <button key={m.k} type="button" onClick={() => setPePick(Math.round(m.v))}
                className={`text-[11px] px-1.5 py-0.5 rounded border tabular-nums ${Math.round(m.v) === fairPe ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'} ${m.c.split(' ').slice(1).join(' ')}`}>
                {m.k} {m.v.toFixed(1)}배
              </button>
            ))}
          </div>
        )}
        <p className="text-[11px] text-gray-400 dark:text-gray-500">
          {peExMid != null ? `기본값은 ${peExclude!.label}.` : peMid != null ? '기본값은 과거 PER 중간값.' : '과거 PER 자료가 짧아 기본값 20배.'} 아래 버튼을 누르면 그 값으로 바뀐다.
          지금 PER({peNow?.toFixed(0)}배)로 두면 &lsquo;주가가 이익만큼만 오를 때&rsquo;가 된다. PER은 월말 주가 ÷ 그때의 최근 1년 EPS(적자·200배 이상 제외).
        </p>
      </div>
      </div>

      <div className="rounded bg-blue-50/60 dark:bg-blue-950/20 p-3 space-y-2">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">째깍째깍 — 버핏처럼 초 단위로 보기</p>
        <ClockLive cur={cur} epsAt={epsAt} fairPe={fairPe} shares={shares} sharesOut={sharesOut} extraLive={extraLive}
          fcfPs={fcfPs} dps={divYield > 0 ? price * divYield / 100 : null} />
        <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          보유 주식 수
          <input type="text" inputMode="decimal" placeholder="1" value={sharesTxt} onChange={e => saveShares(e.target.value)}
            className="w-20 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-0.5 tabular-nums" />
          <span className="text-gray-400">주 (비우면 1주 기준 · 이 기기에만 저장)</span>
        </label>
      </div>

      <ul className={`${p} list-disc pl-4 space-y-1`}>
        {fairPerDay != null && <li><b>적정가는 하루에 약 {money(fairPerDay, 3)}씩</b> 오른다(1주 기준, EPS 연 {g.toFixed(1)}% 성장 가정).</li>}
        {ret10 != null && <li><b>지금 사서 10년 뒤 주가가 적정가 선({fairPe}배)에 있으면:</b> 연 {ret10.toFixed(1)}% (배당 {divYield.toFixed(2)}% 포함). 10년 뒤 적정가 약 {money((e10 ?? 0) * fairPe)}.</li>}
        <li>주가는 매일 흔들리지만 파란 선은 이익을 따라 조용히 올라간다. 주가가 띠 아래로 내려오면 더 사고, 위로 크게 벗어나면 서두르지 않는 기준으로 쓴다.</li>
        <li>파란 선이 맞는지는 실적이 나올 때마다 확인한다. 실제 EPS가 점선보다 계속 아래면 성장률을 낮춘다.</li>
      </ul>
      <p className="text-[11px] text-gray-400 dark:text-gray-500">{notes}</p>
    </div>
  )
}

// ── 눈금자 바 (적정 PER·EPS 성장률 공용) ─────────────────────────
type Tick = { k: string; short: string; v: number; c: string } // c: '선 색 글자색'

function TickRuler({ min, max, marks, unit = '', digits = 0 }: { min: number; max: number; marks: Tick[]; unit?: string; digits?: number }) {
  if (!marks.length) return null
  const pctOf = (v: number) => (Math.min(max, Math.max(min, v)) - min) / (max - min)
  const sorted = [...marks].sort((a, b) => a.v - b.v).map((m, i) => ({ ...m, row: i % 3 }))
  return (
    <div className="relative h-14 -mt-1" aria-hidden>
      {sorted.map(m => {
        const pct = pctOf(m.v)
        const left = `calc(${(pct * 100).toFixed(2)}% + ${((0.5 - pct) * 16).toFixed(1)}px)` // 손잡이 중심에 맞춤
        return (
          <div key={m.k} className="absolute top-0 flex flex-col items-center -translate-x-1/2" style={{ left }}>
            <div className={`w-px ${m.c.split(' ')[0]}`} style={{ height: 6 + m.row * 14 }} />
            <span className={`text-[10px] leading-none whitespace-nowrap tabular-nums ${m.c.split(' ').slice(1).join(' ')}`}>
              {m.short} {m.v.toFixed(digits)}{unit}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const TICK_C = {
  min: 'bg-emerald-500 text-emerald-600 dark:text-emerald-400',
  mid: 'bg-blue-600 text-blue-600 dark:text-blue-400',
  mean: 'bg-indigo-500 text-indigo-600 dark:text-indigo-400',
  max: 'bg-red-500 text-red-500',
  y20: 'bg-purple-500 text-purple-600 dark:text-purple-400',
  y10: 'bg-gray-500 text-gray-500 dark:text-gray-400',
  y5: 'bg-gray-400 text-gray-500 dark:text-gray-400',
  pick: 'bg-amber-500 text-amber-600 dark:text-amber-400',
}

// EPS 성장률 눈금: 과거 20·10·5년 연평균(지금까지), 지난 20년 안 5년 구간 성장률의 최소·중간·평균·최대
function growthMarks(anchors: ClockAnchor[], extra: Tick[] = []): Tick[] {
  const out: Tick[] = [...extra]
  const last = anchors[anchors.length - 1]
  if (!last || last[1] <= 0) return out
  const near = (t: number) => {
    let best: ClockAnchor | null = null
    for (const a of anchors) if (Math.abs(a[0] - t) <= 0.6 && (!best || Math.abs(a[0] - t) < Math.abs(best[0] - t))) best = a
    return best
  }
  const cagr = (a: ClockAnchor, b: ClockAnchor) =>
    a[1] > 0 && b[1] > 0 && b[0] - a[0] > 1 ? (Math.pow(b[1] / a[1], 1 / (b[0] - a[0])) - 1) * 100 : null
  for (const [n, c] of [[20, TICK_C.y20], [10, TICK_C.y10], [5, TICK_C.y5]] as const) {
    const a = near(last[0] - n)
    const v = a ? cagr(a, last) : null
    if (v != null) out.push({ k: `과거 ${n}년 연평균`, short: `${n}년`, v, c })
  }
  const roll: number[] = []
  for (const a of anchors) {
    if (a[0] < last[0] - 20 - 0.01 || a[0] > last[0] - 5 + 0.01) continue
    const b = near(a[0] + 5)
    const v = b && b !== a ? cagr(a, b) : null
    if (v != null) roll.push(v)
  }
  if (roll.length >= 4) {
    const avg = roll.reduce((x, y) => x + y, 0) / roll.length
    out.push({ k: '5년 구간 최소', short: '최소', v: Math.min(...roll), c: TICK_C.min })
    out.push({ k: '5년 구간 중간값', short: '중간', v: quantile(roll, 0.5), c: TICK_C.mid })
    out.push({ k: '5년 구간 평균', short: '평균', v: avg, c: TICK_C.mean })
    out.push({ k: '5년 구간 최대', short: '최대', v: Math.max(...roll), c: TICK_C.max })
  }
  return out
}

function GrowthBar({ g, setG, marks, note }: { g: number; setG: (v: number) => void; marks: Tick[]; note: ReactNode }) {
  const lo = Math.max(-30, Math.floor(Math.min(-5, ...marks.map(m => m.v - 1))))
  const hi = Math.min(60, Math.ceil(Math.max(30, ...marks.map(m => m.v + 1))))
  const snap = (v: number) => Math.round(Math.max(lo, Math.min(hi, v)) * 2) / 2
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-gray-700 dark:text-gray-200">EPS 성장률 직접 조절 (연)</span>
        <span className="tabular-nums font-semibold text-gray-900 dark:text-white">{Math.round(g * 10) / 10}%</span>
      </div>
      <input type="range" min={lo} max={hi} step={0.5} value={g} onChange={e => setG(Number(e.target.value))} className="w-full accent-blue-600" />
      <TickRuler min={lo} max={hi} marks={marks} unit="%" digits={1} />
      <div className="flex flex-wrap gap-1">
        {marks.map(m => (
          <button key={m.k} type="button" onClick={() => setG(snap(m.v))}
            className={`text-[11px] px-1.5 py-0.5 rounded border tabular-nums ${Math.abs(snap(m.v) - g) < 0.01 ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'} ${m.c.split(' ').slice(1).join(' ')}`}>
            {m.k} {m.v.toFixed(1)}%
          </button>
        ))}
      </div>
      <p className="text-[11px] text-gray-400 dark:text-gray-500">{note}</p>
    </div>
  )
}

// ── 에르메스 2번 ─────────────────────────────────────────────
// 에르메스 연말 EPS (유로, 회사 발표 기준 2001~2025, 1993~2000은 순이익÷주식 수 환산)
const RMS_EPS_HIST: Record<number, number> = {
  // 1993~2000년: 순이익 ÷ 2001년 주식 수 환산(분할 반영, 1995년은 사이 값 추정) — RMS_rolling.json epsDecomp와 같은 값
  1993: 0.29, 1994: 0.40, 1995: 0.51, 1996: 0.64, 1997: 0.74, 1998: 0.81, 1999: 1.08, 2000: 1.59,
  2001: 1.84, 2002: 1.96, 2003: 1.97, 2004: 1.94, 2005: 2.27, 2006: 2.51, 2007: 2.71, 2008: 2.76,
  2009: 2.75, 2010: 4.01, 2011: 5.68, 2012: 7.11, 2013: 7.59, 2014: 8.24, 2015: 9.32, 2016: 10.53,
  2017: 11.70, 2018: 13.48, 2019: 14.66, 2020: 13.27, 2021: 23.37, 2022: 32.2, 2023: 41.19, 2024: 43.93, 2025: 43.15,
}
const RMS_ANCHORS: ClockAnchor[] = [
  ...Object.entries(RMS_EPS_HIST).map(([y, e]) => [Number(y) + 1, e] as ClockAnchor),
  [2026.5, 43.08], // 2026년 6월 말 최근 1년 EPS
]
// 월말 주가 파일(2000-01~) 이전 월말 종가 (EUR, 트레이딩뷰 RMS 월봉, 분할 반영·배당 미반영, 2026-10 사용자 입력).
// 1993년 12월 = 1994년 1월 시가. scripts/rms_actual_pe.py 의 MANUAL_YE(연말 값)와 같은 출처.
const RMS_PRE2000_DEC1993 = 7.96
const RMS_PRE2000_MONTHLY: Record<number, number[]> = {
  1994: [8.826, 8.994, 9.656, 8.47, 9.234, 9.114, 9.944, 9.894, 10.74, 10.335, 10.215, 9.824],
  1995: [9.47, 9.52, 10.4, 10.685, 11.485, 11.385, 11.52, 11.945, 14.855, 14.565, 14.825, 15.585],
  1996: [17.53, 20.06, 22.68, 23.19, 24.39, 23.04, 20.94, 20.65, 20.51, 21.99, 22.44, 24.39],
  1997: [26.73, 26.20, 26.81, 26.59, 26.58, 27.95, 28.76, 25.76, 23.88, 19.765, 21.20, 21.34],
  1998: [23.38, 24.24, 23.53, 23.18, 23.83, 24.14, 21.65, 17.895, 18.805, 21.34, 21.90, 23.02],
  1999: [25, 22.35, 24.67, 26, 29.03, 32.32, 31.17, 34.50, 34.17, 34.67, 42.67, 49.93],
}
const RMS_SHARES = 104.5e6 // 자사주 제외 유통 주식 수(근사)

// 에르메스 연도별 (백만 유로, 회사 발표: 연차보고서 2018·2021, 연간 실적 발표 2023·2025)
// ni 순이익(그룹 몫), op 영업이익(2018년은 2021 보고서의 재작성 값), fcf 조정 잉여현금흐름(영업현금 − 영업 투자 − 리스 상환),
// ocf 영업활동 현금흐름(운전자본 변화 반영), capex 영업 투자, eq 자기자본(그룹 몫), cash 재작성 순현금(차입금 차감 후)
const RMS_FIN: Record<number, { ni: number; op: number; eq: number; cash: number; fcf?: number; ocf?: number; capex?: number; div?: number }> = {
  2014: { ni: 859, op: 1299, eq: 3449, cash: 1494 },
  2015: { ni: 973, op: 1541, eq: 3742, cash: 1614 },
  2016: { ni: 1100, op: 1697, eq: 4383, cash: 2345 },
  2017: { ni: 1221, op: 1922, eq: 5039, cash: 3050, fcf: 1340, ocf: 1605, capex: 265 },
  2018: { ni: 1405, op: 2075, eq: 5470, cash: 3615, fcf: 1447, ocf: 1760, capex: 312 },
  2019: { ni: 1528, op: 2339, eq: 6568, cash: 4562, fcf: 1406, ocf: 2087, capex: 478 },
  2020: { ni: 1385, op: 1981, eq: 7380, cash: 4904, fcf: 995, ocf: 1643, capex: 448 },
  2021: { ni: 2445, op: 3530, eq: 9400, cash: 7070, fcf: 2661, ocf: 3406, capex: 532 },
  2022: { ni: 3367, op: 4697, eq: 12440, cash: 9742, fcf: 3405, ocf: 4184, capex: 518, div: 852 },
  2023: { ni: 4311, op: 5650, eq: 15201, cash: 11164, fcf: 3192, ocf: 4328, capex: 859, div: 1386 },
  2024: { ni: 4603, op: 6150, eq: 17327, cash: 12039, fcf: 3767, ocf: 5139, capex: 1067, div: 2705 },
  2025: { ni: 4524, op: 6569, eq: 18840, cash: 12773, fcf: 3880, ocf: 5374, capex: 1161, div: 2796 },
}

// RMS_FIN → CashData + 지표. ROIC = 영업이익 × (순이익 ÷ 영업이익, 세후 근사) ÷ 평균(자기자본 − 순현금)
function rmsCash(price: number, monthly: Array<{ d: string; c: number }>) {
  const dec: Record<number, number> = {}
  for (const r of monthly) if (r.d.endsWith('-12')) dec[Number(r.d.slice(0, 4))] = r.c
  const years: Record<string, CashYear> = {}
  const ys = Object.keys(RMS_FIN).map(Number).sort((a, b) => a - b)
  ys.forEach((y, i) => {
    const r = RMS_FIN[y], pr = RMS_FIN[ys[i - 1]]
    const avgEq = pr ? (r.eq + pr.eq) / 2 : r.eq
    const ic = r.eq - r.cash, icPrev = pr ? pr.eq - pr.cash : null
    const avgIc = icPrev != null ? (ic + icPrev) / 2 : ic
    const tax = Math.min(0.4, Math.max(0.2, 1 - r.ni / r.op))
    const fcfPs = r.fcf != null ? r.fcf * 1e6 / RMS_SHARES : undefined
    years[String(y)] = {
      end: `${y}-12-31`, ni: r.ni, fcf: r.fcf, ocf: r.ocf, capex: r.capex, div: r.div, equity: r.eq, cashInv: r.cash,
      roe: Math.round(r.ni / avgEq * 1000) / 10,
      roic: avgIc > 0 ? Math.round(r.op * (1 - tax) / avgIc * 1000) / 10 : undefined,
      conv: r.fcf != null ? Math.round(r.fcf / r.ni * 100) / 100 : undefined,
      fcfPs, fcfYield: fcfPs != null && dec[y] ? Math.round(fcfPs / dec[y] * 1000) / 10 : undefined,
    }
  })
  const last = RMS_FIN[2025]
  const cash: CashData = { years, ttm: { asOf: '2025-12-31', ocf: last.ocf!, capex: last.capex!, fcf: last.fcf!, ni: last.ni, annualOnly: true } }
  const recent = ys.slice(-5).map(y => years[String(y)])
  const med = (a: number[]) => quantile(a, 0.5)
  const fcfPs = last.fcf! * 1e6 / RMS_SHARES
  const m = {
    earnYield: RMS_TTM_EPS / price * 100,
    fcfYield: fcfPs / price * 100,
    roe: years['2025'].roe ?? null, roic: years['2025'].roic ?? null,
    roe5: med(recent.map(r => r.roe!).filter(v => v != null)),
    roic5: med(recent.map(r => r.roic!).filter(v => v != null)),
    conv5: recent.reduce((a, r) => a + (r.fcf ?? 0), 0) / recent.reduce((a, r) => a + (r.ni ?? 0), 0),
  }
  return { cash, m, fcfPs }
}
const HNWI_2025 = 25.3e6   // 금융자산 100만 달러 이상 (Capgemini 2025)

type MonthlyPrice = { last: { date: string; close: number }; rows: Array<{ d: string; c: number }> }

function HermesValueClock({ g: gFactors, f }: { g: number; f: Factors }) {
  const [px, setPx] = useState<MonthlyPrice | null>(null)
  const [gUser, setGUser] = useState<number | null>(null)
  const g = gUser ?? gFactors // 4번 값 그대로 (반올림하지 않음)
  useEffect(() => {
    fetch('/data/rolling/RMS_monthly_price.json').then(r => (r.ok ? r.json() : null)).then(setPx).catch(() => {})
  }, [])
  const box = 'rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3'
  const p = 'text-xs leading-relaxed text-gray-600 dark:text-gray-300'
  const monthly = [
    ...(px ? [{ t: 1994, price: RMS_PRE2000_DEC1993 }, ...Object.entries(RMS_PRE2000_MONTHLY).flatMap(([y, cs]) => cs.map((c, i) => ({ t: Number(y) + (i + 1) / 12, price: c })))] : []), // 1993년 12월~1999년 12월
    ...(px?.rows ?? []).map(r => { const [y, m] = r.d.split('-').map(Number); return { t: y + m / 12, price: r.c } }),
  ]
  const eur = (v: number, d = 0) => `€${v.toLocaleString('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d })}`

  const extraLive = (now: number, fairNow: number) => {
    const parts = [
      { k: '① 판매량', r: f.q }, { k: '② 가격 인상', r: f.pr }, { k: '③ 이익률', r: f.mg }, { k: '④ 기타', r: f.ot },
    ]
    const tNow = decYear(now)
    const hnwiNow = HNWI_2025 * Math.pow(1.04, tNow - 2025)
    const hnwiPerDay = hnwiNow * Math.log(1.04) / 365.25
    const startOfDay = new Date(new Date(now).setHours(0, 0, 0, 0)).getTime()
    const hnwiToday = hnwiPerDay * (now - startOfDay) / 86400000
    return (
      <div className="rounded bg-white/70 dark:bg-gray-900/60 p-3 space-y-1.5">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">적정가가 하루에 오르는 폭을 요인별로 쪼개면 (1주 기준)</p>
        <table className="text-xs">
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {parts.map(x => {
              const perDay = fairNow * Math.log(1 + x.r / 100) / 365.25
              return (
                <tr key={x.k}>
                  <td className="py-1 pr-4 text-gray-700 dark:text-gray-200">{x.k} (연 {x.r > 0 ? '+' : ''}{x.r}%)</td>
                  <td className={`py-1 tabular-nums text-right ${perDay < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{perDay >= 0 ? '+' : '−'}{eur(Math.abs(perDay), 3)} / 일</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className={p}>
          <b>자산가 시계:</b> 금융자산 100만 달러 이상 자산가는 지금 약 {(hnwiNow / 1e6).toFixed(1)}백만 명. 직전 5년 속도(연 4%, 물가 포함)로 늘면 <b>하루 약 {Math.round(hnwiPerDay).toLocaleString()}명</b>,
          {' '}약 {(86400 / hnwiPerDay).toFixed(0)}초에 1명이다. 오늘 0시 이후 <b>{Math.floor(hnwiToday).toLocaleString()}명</b> 늘었다.
          4번 기본값은 이 증가율을 ① 판매량으로 쓴다.
        </p>
      </div>
    )
  }

  return (
    <div className={box}>
      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">2. 이익 시계 — 적정가 선 vs 주가</h4>
      {px ? (<>
        <ValueClockCore
          growthBar={<GrowthBar g={g} setG={setGUser}
        marks={growthMarks(RMS_ANCHORS, [
          ...HERMES_SCENARIOS.map(sc => ({ k: `앞으로 ${sc.label}`, short: sc.label === '지금 상태 지속' ? '지속' : sc.label, v: epsGrowthOf(sc.f), c: 'bg-teal-500 text-teal-600 dark:text-teal-400' })),
        ])}
        note={<>청록색 눈금 = 앞으로 예상(아래 4번의 세 경우), 나머지 눈금 = 과거 실제 성장률. 시작 값은 4번에서 고른 경우({HERMES_SCENARIOS.find(sc => (Object.keys(sc.f) as (keyof Factors)[]).every(k => sc.f[k] === f[k]))?.label ?? '직접 조절'} {gFactors.toFixed(1)}%).
          {gUser != null && <> <button type="button" onClick={() => setGUser(null)} className="underline text-blue-600 dark:text-blue-400">처음 값으로 되돌리기</button></>}
          {' '}과거 N년 = N년 전부터 지금까지 연평균, 5년 구간 = 지난 20년을 5년씩 끊어 본 성장률의 범위.
          {' '}<b>앞으로 예상이 과거보다 낮은 이유</b>는 4번 &lsquo;왜 과거보다 낮게 잡았나&rsquo;에 있다.</>} />}
          cur="€" anchors={RMS_ANCHORS} monthly={monthly} last={px.last} g={g}
          sharesOut={RMS_SHARES} divYield={1.35} storageKey="rms-shares" extraLive={extraLive}
          fcfPs={rmsCash(px.last.close, px.rows).fcfPs}
          peExclude={{ from: 2019, to: 2026, label: '거품기(2019~2025) 뺀 중간값' }}
          notes="주가는 배당을 반영하지 않은 실제 월말 종가(분할 반영). 1993년 12월~1999년은 트레이딩뷰 월말 종가. 1년 EPS는 연말 실적 사이를 매끄럽게 이은 근사치이고, 2026년 6월 이후는 4번의 성장률로 연장했다. 초 단위 숫자는 연간 이익을 시간으로 나눈 것이며 실제 회계 처리와 다르다. 유통 주식 수 약 1억 450만 주(근사). 내 몫 잉여현금은 2025년 조정 잉여현금흐름(38.8억 유로) ÷ 유통 주식 수."
        />
        {(() => {
          const r = rmsCash(px.last.close, px.rows)
          return <CashReturnPanel cash={r.cash} m={r.m} cur="€" source={
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              회사 발표 숫자(2018·2021 연차보고서, 2023·2025 연간 실적 발표). 잉여현금흐름은 회사의 &lsquo;조정 잉여현금흐름&rsquo; = 영업활동 현금흐름 − 영업 투자 − 리스 상환으로,
              미국 종목(리스 상환을 빼지 않음)보다 약간 보수적이다. 2016년 이전은 이 값이 없어 비워 뒀다. 최근 1년 = 2025년 연간.
              에르메스는 빚이 없고 순현금이 많아(2025년 말 128억 유로) 투하자본 = 자기자본 − 순현금으로 계산했다. 그래서 ROIC가 매우 높게 나온다.
              ROE = 순이익 ÷ 평균 자기자본, ROIC = 영업이익 × (순이익 ÷ 영업이익) ÷ 평균 투하자본(세금·금융 손익을 순이익 비율로 근사).
            </p>} />
        })()}
      </>) : <p className="text-xs text-gray-400">월별 주가 데이터를 불러오는 중…</p>}
    </div>
  )
}

// ── 전 종목 이익 시계 (SEC 공시 EPS + 월말 주가) ─────────────
type ClockFund = Fundamentals & {
  epsEnd?: Record<string, string>
  ttmAsOf?: string
  monthly?: { start: string; c: Array<number | null> }
  lastPrice?: { date: string; close: number }
  shares?: { count: number; asOf: string } | null
  epsOld?: Record<string, number>   // SEC 10-K 원문에서 읽은 2008년 이전 EPS
  cash?: CashData                   // export_cashflow.py: 잉여현금흐름·자본 수익률
}

// 금액은 백만 달러
type CashYear = {
  end: string; ocf?: number; capex?: number; fcf?: number; ni?: number; div?: number; buyback?: number
  equity?: number; debt?: number; cashInv?: number; roe?: number; roic?: number; conv?: number; fcfPs?: number; fcfYield?: number
}
type CashData = {
  years: Record<string, CashYear>
  ttm?: { asOf: string; ocf: number; capex: number; fcf: number; ni: number; annualOnly?: boolean }
  bank?: boolean   // 은행·증권·보험: 고객 돈이 현금흐름에 섞여 잉여현금흐름을 계산하지 않음
}

// ── 1달러당 이익·현금, 자본 수익률 ─────────────────────────────
function CashReturnPanel({ cash, m, cur = '$', source }: {
  cash: CashData
  m: Pick<Metrics, 'earnYield' | 'fcfYield' | 'roe' | 'roe5' | 'roic' | 'roic5' | 'conv5'>
  cur?: string; source?: ReactNode
}) {
  const p = 'text-xs leading-relaxed text-gray-600 dark:text-gray-300'
  const tile = 'rounded bg-gray-50 dark:bg-gray-800/60 px-3 py-2.5'
  const lab = 'text-[11px] text-gray-500 dark:text-gray-400'
  const big = 'text-sm font-semibold tabular-nums text-gray-900 dark:text-white'
  const sub = 'text-[11px] text-gray-500 dark:text-gray-400 tabular-nums'
  const pc = (v: number | null | undefined, d = 1) => (v == null ? '—' : `${v.toFixed(d)}%`)
  // 백만 단위 → 억 단위 표기 (달러·유로)
  const usd = (v: number | null | undefined) => {
    if (v == null) return '—'
    const e = v / 100
    const a = Math.abs(e)
    return `${v < 0 ? '−' : ''}${cur}${a >= 100 ? Math.round(a).toLocaleString() : a.toFixed(a >= 10 ? 1 : 2)}억`
  }
  const unit = cur === '€' ? '유로' : '달러'
  const cent = cur === '€' ? '유로센트' : '센트'
  const ys = Object.keys(cash.years).map(Number).sort((a, b) => b - a)
  const rows = ys.slice(0, 12).map(y => ({ y, ...cash.years[String(y)] }))
  const lastY = rows[0]
  const t = cash.ttm
  const conv1 = t && t.ni > 0 ? t.fcf / t.ni : null
  const payout = lastY?.fcf && lastY.fcf > 0
    ? { div: (lastY.div ?? 0) / lastY.fcf, buy: (lastY.buyback ?? 0) / lastY.fcf } : null
  const ey = m.earnYield, fy = m.fcfYield
  const roicTone = (v?: number | null) => (v == null ? '' : v >= 20 ? 'text-emerald-600 dark:text-emerald-400' : v < 8 ? 'text-red-500' : '')

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3">
      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">1{unit}당 얼마를 버나 — 이익·잉여현금·자본 수익률</h4>
      <p className={p}>
        주당 순이익(EPS)은 주가가 회사마다 달라 서로 비교할 수 없다. 그래서 1달러 기준으로 바꿔 본다.
        <b> 내가 낸 1달러</b>가 버는 돈은 이익 수익률·잉여현금흐름 수익률(가격이 싼지),
        <b> 회사가 사업에 묶어둔 1달러</b>가 버는 돈은 ROE·ROIC(사업이 얼마나 좋은지)다.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div className={tile}>
          <p className={lab}>이익 수익률 (EPS ÷ 주가)</p>
          <p className={big}>{pc(ey, 2)}</p>
          <p className={sub}>{ey ? `1${unit}로 산 주식이 연 ${ey.toFixed(1)}${cent} 이익 · PER ${(100 / ey).toFixed(1)}배의 역수` : ''}</p>
        </div>
        <div className={tile}>
          <p className={lab}>잉여현금흐름 수익률</p>
          <p className={`${big} ${fy != null && fy < 0 ? 'text-red-500' : ''}`}>{pc(fy, 2)}</p>
          <p className={sub}>{fy != null ? `1${unit}당 연 ${fy.toFixed(1)}${cent}가 현금으로 남음` : ''}</p>
        </div>
        <div className={tile}>
          <p className={lab}>현금 전환율 (잉여현금 ÷ 순이익)</p>
          <p className={big}>{m.conv5 != null ? `${Math.round(m.conv5 * 100)}%` : '—'}</p>
          <p className={sub}>5년 합계 기준{conv1 != null ? ` · 최근 1년 ${Math.round(conv1 * 100)}%` : ''}</p>
        </div>
        <div className={tile}>
          <p className={lab}>ROE (순이익 ÷ 자기자본)</p>
          <p className={big}>{pc(m.roe)}</p>
          <p className={sub}>5년 중간값 {pc(m.roe5)}</p>
        </div>
        <div className={tile}>
          <p className={lab}>ROIC (세후 영업이익 ÷ 투하자본)</p>
          <p className={`${big} ${roicTone(m.roic)}`}>{pc(m.roic)}</p>
          <p className={sub}>5년 중간값 {pc(m.roic5)}</p>
        </div>
        {t && <div className={tile}>
          <p className={lab}>최근 1년 잉여현금흐름</p>
          <p className={`${big} ${t.fcf < 0 ? 'text-red-500' : ''}`}>{usd(t.fcf)}</p>
          <p className={sub}>영업현금 {usd(t.ocf)} − 설비투자 {usd(t.capex)}</p>
        </div>}
      </div>

      {cash.bank && <p className={p}><b>은행·증권·보험사는 잉여현금흐름을 계산하지 않는다.</b> 고객 예금·대출·보험료 같은 고객 돈이 영업 현금흐름에 섞여 있어 숫자가 크게 흔들리고 뜻이 없다. 이익 수익률과 ROE로 본다.</p>}
      <ul className={`${p} list-disc pl-4 space-y-1`}>
        <li><b>가격 비교:</b> 이익 수익률·잉여현금흐름 수익률이 높을수록 같은 1달러로 더 많이 산다. 미국 10년 국채 수익률과 견줘 보면 감이 온다.</li>
        <li><b>현금 전환율</b>이 100% 근처면 이익이 거의 그대로 현금으로 남는다. 계속 낮으면 이익의 상당 부분이 설비·재고에 다시 묶이는 사업이다.</li>
        <li><b>ROIC가 높을수록</b> 다시 투자한 돈이 빨리 불어난다. 장기 이익 성장률 ≈ ROIC × 재투자 비율. 보통 15~20% 이상이면 좋은 사업으로 본다.</li>
        <li><b>잉여현금흐름은 해마다 크게 흔들린다.</b> 큰 공장·데이터센터 투자가 몰린 해는 낮고, 재고·외상값이 줄어든 해는 높다. 한 해보다 5년 현금 전환율을 본다.
          자동차·중장비처럼 고객 대출을 해 주는 금융 자회사가 있는 회사(GM·포드·디어 등)는 그 대출 회수가 섞여 숫자가 부풀 수 있다.</li>
        <li><b>ROE는 빚·자사주에 부풀 수 있다.</b> 자사주를 많이 사 자기자본이 작아지면(심하면 마이너스) ROE가 과장되거나 계산되지 않는다. 그래서 ROIC를 함께 본다.</li>
        {payout && <li><b>{lastY.y}년 잉여현금의 쓰임:</b> 배당 {Math.round(payout.div * 100)}%, 자사주 매입 {Math.round(payout.buy * 100)}%{payout.div + payout.buy > 1.05 ? ' (100%가 넘는 부분은 쌓아둔 현금·빚으로 충당)' : ''}.</li>}
      </ul>

      <div className="overflow-x-auto">
        <table className="text-xs w-full">
          <thead>
            <tr className="text-gray-500 dark:text-gray-400">
              <th className="text-left py-1 pr-3 font-medium">연도</th>
              <th className="text-right py-1 px-2 font-medium whitespace-nowrap">순이익</th>
              <th className="text-right py-1 px-2 font-medium whitespace-nowrap">잉여현금</th>
              <th className="text-right py-1 px-2 font-medium whitespace-nowrap">전환율</th>
              <th className="text-right py-1 px-2 font-medium">ROE</th>
              <th className="text-right py-1 px-2 font-medium">ROIC</th>
              <th className="text-right py-1 pl-2 font-medium whitespace-nowrap">잉여현금 수익률</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 tabular-nums">
            {rows.map(r => (
              <tr key={r.y}>
                <td className="py-1 pr-3 text-gray-700 dark:text-gray-200">{r.y}</td>
                <td className={`py-1 px-2 text-right ${(r.ni ?? 0) < 0 ? 'text-red-500' : ''}`}>{usd(r.ni)}</td>
                <td className={`py-1 px-2 text-right ${(r.fcf ?? 0) < 0 ? 'text-red-500' : ''}`}>{usd(r.fcf)}</td>
                <td className="py-1 px-2 text-right">{r.conv != null ? `${Math.round(r.conv * 100)}%` : '—'}</td>
                <td className="py-1 px-2 text-right">{pc(r.roe)}</td>
                <td className={`py-1 px-2 text-right ${roicTone(r.roic)}`}>{pc(r.roic)}</td>
                <td className="py-1 pl-2 text-right">{pc(r.fcfYield)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {source ?? <p className="text-[11px] text-gray-400 dark:text-gray-500">
        SEC 공시(10-K·10-Q) 기준. 잉여현금흐름 = 영업활동 현금흐름 − 유형자산 취득. 최근 1년 = 최근 연간 + 올해 누적 − 작년 같은 기간{t ? (t.annualOnly ? '(분기 자료가 맞지 않아 최근 연간 값)' : ` (${t.asOf}까지)`) : ''}.
        ROE = 순이익 ÷ 평균 자기자본. ROIC = 영업이익(없으면 세전이익 + 이자비용) × (1 − 실효 법인세율) ÷ 평균(자기자본 + 차입금 − 현금·단기 투자자산). 자기자본이 마이너스이거나 너무 작은 회사(ROE 300% 초과), 현금이 많아 투하자본이 아주 작은 회사, 은행·보험사의 ROIC는 비워 둔다.
        연도별 잉여현금 수익률은 주당 잉여현금 ÷ 그해 12월 말 주가.
      </p>}
    </div>
  )
}

function StockValueClock({ f, stockKey, rolling, title = '이익 시계 — 적정가 선 vs 주가', judged }: {
  f: ClockFund; stockKey: string; rolling?: StockData; title?: string
  judged?: DeepInsight['growth']   // 개별 분석에서 판단한 성장률 (있으면 기본값)
}) {
  const m = f.metrics
  const clamp = (v: number) => Math.max(0, Math.min(15, v))
  const g10 = m.epsCagr10, g5 = m.epsCagr5
  const base = g10 != null && g5 != null ? clamp(Math.min(g10, g5)) : g10 != null ? clamp(g10) : g5 != null ? clamp(g5) : 5
  const [g, setG] = useState(Math.round((judged?.base ?? base) * 2) / 2)

  if (!f.monthly || !f.epsEnd || !f.lastPrice || m.stale || m.ttmEps == null) return null

  const anchors: ClockAnchor[] = Object.entries(f.eps)
    .filter(([y, e]) => e != null && f.epsEnd![y])
    .map(([y, e]) => [decYear(Date.parse(f.epsEnd![y])), e as number] as ClockAnchor)
    .sort((a, b) => a[0] - b[0])
  // SEC 전자 공시(2008년 무렵~) 이전 EPS: 10-K 원문에서 읽은 값(우선), 없으면 롤링 데이터 값을 앞에 이어 붙임 (같은 결산 월 기준)
  const older = new Map<number, number>()
  for (const d of (((rolling as any)?.epsDecomp ?? []) as Decomp[])) {
    if ((d as any).epsBuy != null) older.set(d.buyYear, (d as any).epsBuy)
    if ((d as any).epsSell != null) older.set(d.sellYear, (d as any).epsSell)
  }
  for (const [y, e] of Object.entries(f.epsOld ?? {})) older.set(Number(y), e)
  const firstSecYear = Math.min(...Object.keys(f.epsEnd).map(Number))
  if (anchors.length && older.size) {
    const mmdd = f.epsEnd[String(firstSecYear)].slice(4)
    for (const [y, e] of older) {
      if (y < firstSecYear && e != null) anchors.push([decYear(Date.parse(`${y}${mmdd}`)), e])
    }
    anchors.sort((a, b) => a[0] - b[0])
  }
  if (anchors.length < 3) return null
  if (f.ttmAsOf) {
    const tT = decYear(Date.parse(f.ttmAsOf))
    if (tT > anchors[anchors.length - 1][0] + 0.1) anchors.push([tT, m.ttmEps])
  }
  const [y0, m0] = f.monthly.start.split('-').map(Number)
  const monthly = f.monthly.c
    .map((c, i) => ({ t: y0 + (m0 + i) / 12, price: c }))
    .filter((r): r is { t: number; price: number } => r.price != null && r.price > 0)

  // 장기 성장률: 처음 흑자 EPS(주가 기록이 있는 1995년 이후) → 최근 1년 EPS
  const lastA = anchors[anchors.length - 1]
  const firstA = anchors.find(a => a[1] > 0 && a[0] >= 1995)
  const gLong = firstA && lastA[1] > 0 && lastA[0] - firstA[0] >= 12
    ? { g: (Math.pow(lastA[1] / firstA[1], 1 / (lastA[0] - firstA[0])) - 1) * 100, yrs: Math.round(lastA[0] - firstA[0]) }
    : null

  const box = 'rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3'
  const marks = growthMarks(anchors, judged
    ? [{ k: '개별 분석 판단', short: '판단', v: judged.base, c: TICK_C.pick }, { k: '보수적', short: '보수', v: base, c: TICK_C.y10 }]
    : [{ k: '보수적', short: '보수', v: base, c: TICK_C.pick }])
  if (gLong && gLong.yrs > 21) marks.push({ k: `장기 ${gLong.yrs}년 연평균`, short: `${gLong.yrs}년`, v: gLong.g, c: TICK_C.y20 })

  return (
    <>
    <div className={box}>
      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h4>
      <ValueClockCore
        growthBar={<GrowthBar g={g} setG={setG} marks={marks}
          note={<>{judged && <>기본값은 4번 개별 분석의 판단(연 {judged.base}%, 범위 {judged.lo}~{judged.hi}%). </>}보수적 = 과거 5년·10년 성장률 중 낮은 값(0~15%로 제한). 과거 N년 = N년 전부터 지금까지 연평균. 5년 구간 = 지난 20년을 5년씩 끊어 본 성장률의 범위. 최근 몇 년이 부진했던 기업은 값 차이가 크다 — 어느 쪽이 앞으로에 가까운지는 직접 판단한다.</>} />}
        cur="$" anchors={anchors} monthly={monthly} last={f.lastPrice} g={g}
        sharesOut={f.shares?.count ?? null} divYield={m.divYield ?? 0} storageKey={`clock-shares-${stockKey}`}
        fcfPs={m.fcfPs ?? null}
        notes={`EPS는 SEC 공시(10-K) 회계연도 값을 마감일 기준으로 이은 근사치이고(2008년 무렵 이전은 10-K 원문의 5년 요약 표에서 읽고 겹치는 해로 맞춘 값), ${f.ttmAsOf ?? '최근'} 이후는 정한 성장률로 연장했다. 주가는 배당을 반영하지 않은 월말 종가(분할 반영). 일회성 손익이 큰 해는 선이 출렁인다. 회사 전체 숫자는 공시 유통 주식 수${f.shares ? `(${f.shares.asOf})` : ''} × 최근 1년 EPS로 계산한 근사치.`}
      />
    </div>
    {f.cash && <CashReturnPanel cash={f.cash} m={m} />}
    </>
  )
}

function StockValueClockByKey({ stockKey, rolling, title }: { stockKey: string; rolling?: StockData; title?: string }) {
  const [f, setF] = useState<ClockFund | null>(null)
  useEffect(() => {
    fetch(`/data/fundamentals/${stockKey}.json`).then(r => (r.ok ? r.json() : null)).then(setF).catch(() => {})
  }, [stockKey])
  return f ? <StockValueClock f={f} stockKey={stockKey} rolling={rolling} title={title} /> : null
}

// ── 연말 PER 흐름 차트 (에르메스 3-1) ─────────────────────────
function PeTimelineChart({ timeline, peNow }: { timeline: Array<[number, number]>; peNow: number }) {
  const chartRef = useRef<ChartJS | null>(null)
  const [pluginLoaded, setPluginLoaded] = useState(false)
  useEffect(() => {
    import('chartjs-plugin-zoom').then(({ default: z }) => { ChartJS.register(z); setPluginLoaded(true) })
  }, [])
  if (!timeline.length) return null
  const x0 = timeline[0][0], x1 = timeline[timeline.length - 1][0] + 1
  const ptColor = (pe: number) => pe >= 40 ? 'rgba(239,68,68,0.95)' : pe >= 30 ? 'rgba(249,115,22,0.95)' : pe >= 20 ? 'rgba(107,114,128,0.95)' : 'rgba(16,185,129,0.95)'
  // 배경 띠: 20배 미만 / 20~30 / 30~40 / 40배 이상
  const bands = {
    id: 'peBands',
    beforeDatasetsDraw: (c: any) => {
      const { ctx, chartArea: { left, right, top, bottom }, scales: { y } } = c
      const fill = (lo: number, hi: number, color: string) => {
        const yTop = Math.max(top, y.getPixelForValue(hi)), yBot = Math.min(bottom, y.getPixelForValue(lo))
        if (yBot > yTop) { ctx.fillStyle = color; ctx.fillRect(left, yTop, right - left, yBot - yTop) }
      }
      ctx.save()
      fill(0, 20, 'rgba(16,185,129,0.07)'); fill(30, 40, 'rgba(249,115,22,0.06)'); fill(40, 200, 'rgba(239,68,68,0.06)')
      // 지금 PER 가로선
      const yNow = y.getPixelForValue(peNow)
      if (yNow >= top && yNow <= bottom) {
        ctx.strokeStyle = 'rgba(37,99,235,0.9)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(left, yNow); ctx.lineTo(right, yNow); ctx.stroke()
        ctx.setLineDash([]); ctx.fillStyle = 'rgba(37,99,235,0.95)'; ctx.font = '11px sans-serif'
        ctx.fillText(`지금 ${peNow.toFixed(1)}배`, left + 4, yNow - 4)
      }
      ctx.restore()
    },
  }
  const data: any = {
    datasets: [
      { label: '연말 PER', data: timeline.map(([t, pe]) => ({ x: t, y: pe })), borderColor: 'rgba(75,85,99,0.8)', borderWidth: 1.5,
        pointRadius: 3, pointHoverRadius: 5, pointBackgroundColor: timeline.map(([, pe]) => ptColor(pe)), pointBorderWidth: 0, tension: 0 },
    ],
  }
  const options: any = {
    responsive: true, maintainAspectRatio: false, animation: false, parsing: false,
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
    scales: {
      x: { type: 'linear', min: x0, max: x1, ticks: { stepSize: 4, callback: (v: number) => String(v), font: { size: 11 } }, grid: { color: 'rgba(128,128,128,0.08)' } },
      y: { min: 0, suggestedMax: 70, ticks: { stepSize: 10, callback: (v: number) => `${v}배`, font: { size: 11 } }, grid: { color: 'rgba(128,128,128,0.08)' } },
    },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { title: (it: any[]) => `${it[0].parsed.x}년 말`, label: (c: any) => `PER ${c.parsed.y.toFixed(1)}배` } },
      zoom: pluginLoaded ? { pan: { enabled: true, mode: 'x' }, zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' } } : {},
    },
  }
  return (
    <div className="relative">
      <button onClick={() => (chartRef.current as any)?.resetZoom?.()}
        className="absolute top-0 right-0 z-10 px-2 py-0.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded">줌 초기화</button>
      <div style={{ height: 240 }}>
        <Chart ref={chartRef as any} type="line" data={data} options={options} plugins={[bands]} />
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">휠: 확대/축소 &nbsp;|&nbsp; 드래그: 이동</p>
      <p className="text-[11px] text-gray-400 dark:text-gray-500">
        점 색: 초록 20배 미만 · 회색 20~30배 · 주황 30~40배 · 빨강 40배 이상. 파란 점선 = 지금 PER(최근 1년 EPS 기준).
      </p>
    </div>
  )
}

// 에르메스 최근 1년 EPS (회사 발표: 2025년 연간 43.15 − 2025년 상반기 21.43 + 2026년 상반기 21.36)
const RMS_TTM_EPS = 43.08

function RmsInsight({ data }: { data: StockData }) {
  // 숫자는 한 곳에서: 주가는 월말 주가 파일의 최신 종가(자동 갱신), EPS는 회사 발표 최근 1년 값
  const [px, setPx] = useState<MonthlyPrice | null>(null)
  useEffect(() => {
    fetch('/data/rolling/RMS_monthly_price.json').then(r => (r.ok ? r.json() : null)).then(setPx).catch(() => {})
  }, [])
  const [f, setF] = useState<Factors>(HERMES_SCENARIOS[0].f)
  const price = px?.last.close ?? (data as any).current?.price ?? 1356.5
  const priceDate = px?.last.date ?? '2026-10-21'
  const peNow = price / RMS_TTM_EPS
  const gNow = epsGrowthOf(f)
  const ret10 = ((1 + gNow / 100) * 1.0135 - 1) * 100
  const decomp = ((data as any).epsDecomp ?? []) as Decomp[]
  // 2번 이익 시계와 같은 방식의 적정 PER: 마지막 실적 전 20년 월별 PER에서 거품기(2019~2025)를 뺀 중간값
  const peFair = (() => {
    if (!px) return null
    const epsAt = makeEpsAt(RMS_ANCHORS, 0)
    const tLast = RMS_ANCHORS[RMS_ANCHORS.length - 1][0]
    const pes = px.rows.map(r => { const [y, m] = r.d.split('-').map(Number); const t = y + m / 12; const e = epsAt(t); return { t, pe: e && e > 0 ? r.c / e : null } })
      .filter(r => r.t >= tLast - 20 && r.t <= tLast && !(r.t >= 2019 && r.t < 2026) && r.pe != null && r.pe > 0 && r.pe < 200).map(r => r.pe as number)
    return pes.length >= 24 ? Math.round(quantile(pes, 0.5)) : null
  })()
  const epsG10 = decomp.map(d => d.epsGrowthCagr)
  const past10 = epsG10.length ? { min: Math.min(...epsG10), med: quantile(epsG10, 0.5), max: Math.max(...epsG10) } : null
  const retFair10 = peFair ? (Math.pow(Math.pow(1 + gNow / 100, decYear(Date.now()) + 10 - RMS_ANCHORS[RMS_ANCHORS.length - 1][0]) * peFair / peNow, 0.1) * 1.0135 - 1) * 100 : null
  // 연말 PER 흐름: 매수 연도 PER + 매도 연도 PER을 합쳐 연도별로 정리
  const yearPE = new Map<number, number>()
  decomp.forEach(d => { yearPE.set(d.buyYear, d.peBuy); yearPE.set(d.sellYear, d.peSell) })
  const peTimeline = [...yearPE.entries()].sort((a, b) => a[0] - b[0])
  const sgn = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`
  const box = 'rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-2'
  const h4 = 'text-sm font-semibold text-gray-800 dark:text-gray-100'
  const p = 'text-xs leading-relaxed text-gray-600 dark:text-gray-300'
  const th = 'py-1.5 px-2 font-medium text-gray-400 dark:text-gray-500'
  const td = 'py-1.5 px-2 tabular-nums text-gray-700 dark:text-gray-200'

  const bucketDefs = [
    { label: '25배 미만', lo: 0, hi: 25 },
    { label: '25~32배', lo: 25, hi: 32 },
    { label: '32~36배', lo: 32, hi: 36 },
    { label: '36배 이상', lo: 36, hi: 999 },
  ]
  const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length
  const peBuckets = bucketDefs.map(b0 => {
    const b = { ...b0, hl: peNow >= b0.lo && peNow < b0.hi, label: peNow >= b0.lo && peNow < b0.hi ? `${b0.label} (지금 구간)` : b0.label }
    const rows = decomp.filter(d => d.peBuy >= b.lo && d.peBuy < b.hi)
    const tot = rows.map(d => d.totalCagr)
    const pe = rows.map(d => d.peCagr)
    return {
      ...b,
      n: rows.length,
      avg: avg(tot),
      range: `${Math.min(...tot).toFixed(1)}~${Math.max(...tot).toFixed(1)}%`,
      eps: avg(rows.map(d => d.epsGrowthCagr)),
      pe: avg(pe),
      peRange: `${sgn(Math.min(...pe))}~${sgn(Math.max(...pe))}`,
    }
  }).filter(b => b.n > 0)
  const nowB = peBuckets.find(b => b.hl)
  const lowSince = [...peTimeline].reverse().find(([, pe]) => pe <= peNow)
  const similar = decomp.filter(d => Math.abs(d.peBuy - peNow) <= 4)
    .sort((a, b) => Math.abs(a.peBuy - peNow) - Math.abs(b.peBuy - peNow)).slice(0, 8)
  const peUp = decomp.filter(d => d.peSell > d.peBuy)
  const peDownYears = decomp.filter(d => d.peSell <= d.peBuy).map(d => d.buyYear)
  const peEffMed = decomp.length ? quantile(decomp.map(d => d.peCagr), 0.5) : 0
  const epsMin = decomp.length ? Math.min(...decomp.map(d => d.epsGrowthCagr)) : 0
  const epsMax = decomp.length ? Math.max(...decomp.map(d => d.epsGrowthCagr)) : 0

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">인사이트</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500">1 지금 → 2 싼지 비싼지 → 3 과거 → 4 앞으로 이익 → 5 결론 · 숫자는 자동 갱신</p>
      </div>

      <div className={box}>
        <h4 className={h4}>1. 지금 한눈에 — 주가 하락은 이익이 아니라 PER 하락 때문</h4>
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead><tr><th className={`${th} text-left`}></th><th className={`${th} text-right`}>2024년 말</th><th className={`${th} text-right`}>지금 ({priceDate})</th><th className={`${th} text-right`}>변화</th></tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <tr><td className={td}>주가</td><td className={`${td} text-right`}>€2,322</td><td className={`${td} text-right`}>€{price.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}</td><td className={`${td} text-right text-red-500`}>{sgn((price / 2322 - 1) * 100)}%</td></tr>
              <tr><td className={td}>최근 1년 EPS</td><td className={`${td} text-right`}>€43.93</td><td className={`${td} text-right`}>€{RMS_TTM_EPS}</td><td className={`${td} text-right font-semibold`}>{sgn((RMS_TTM_EPS / 43.93 - 1) * 100)}%</td></tr>
              <tr><td className={td}>PER</td><td className={`${td} text-right`}>52.9배</td><td className={`${td} text-right font-semibold`}>{peNow.toFixed(1)}배</td><td className={`${td} text-right text-red-500 font-semibold`}>{sgn((peNow / 52.9 - 1) * 100)}%</td></tr>
            </tbody>
          </table>
        </div>
        <ul className={`${p} list-disc pl-4 space-y-1`}>
          <li><b>이익은 멈췄지만 무너지지 않았다.</b> 2024년 €43.93 → 2025년 €43.15(−1.8%, 프랑스 대기업 특별 법인세. 제외하면 순이익 +5.5%) → 2026년 상반기도 1년 전과 거의 같다(€21.36 vs €21.43).</li>
          <li><b>앞으로 이익:</b> 4번 계산 기준 연 {gNow.toFixed(1)}%(±3%p). 예상 수익률은 4번, 판단은 5번에서 본다.</li>
          <li><b>지금 가격이 싼지 비싼지</b>는 바로 아래 2번 이익 시계에서 본다.</li>
        </ul>
        <p className="text-[11px] text-gray-400 dark:text-gray-500">주가는 자동 갱신(실제 종가), EPS는 회사 발표 최근 1년 값(2025년 연간 43.15 − 2025년 상반기 21.43 + 2026년 상반기 21.36). 해설 문장은 2026년 10월 21일 기준.</p>
      </div>

      <HermesValueClock g={gNow} f={f} />

      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white pt-2">3. 과거에는 왜 수익이 컸나</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500">3-1 매수 시점 PER별 결과 → 3-2 해마다 쪼개 보기 → 3-3 정리</p>
      </div>

      <div className={box}>
        <h4 className={h4}>3-1. 과거 매수 시점 PER별 10년 연평균 수익률 (23개 경우)</h4>
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr>
                <th className={`${th} text-left whitespace-nowrap`}>매수 시 PER</th>
                <th className={`${th} text-right whitespace-nowrap`}>경우 수</th>
                <th className={`${th} text-right whitespace-nowrap`}>평균 수익률</th>
                <th className={`${th} text-right whitespace-nowrap`}>수익률 범위</th>
                <th className={`${th} text-right whitespace-nowrap`}>EPS 효과(평균)</th>
                <th className={`${th} text-right whitespace-nowrap`}>PER 효과(평균)</th>
                <th className={`${th} text-right whitespace-nowrap`}>PER 효과 범위</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {peBuckets.map(b => (
                <tr key={b.label} className={b.hl ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                  <td className={`${td} whitespace-nowrap ${b.hl ? 'font-semibold' : ''}`}>{b.label}</td>
                  <td className={`${td} text-right`}>{b.n}</td>
                  <td className={`${td} text-right ${b.hl ? 'font-semibold' : ''}`}>{b.avg.toFixed(1)}%</td>
                  <td className={`${td} text-right whitespace-nowrap`}>{b.range}</td>
                  <td className={`${td} text-right`}>{sgn(b.eps)}%</td>
                  <td className={`${td} text-right font-semibold ${b.pe >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>{sgn(b.pe)}%p</td>
                  <td className={`${td} text-right whitespace-nowrap`}>{b.peRange}%p</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className={p}>
          PER이 쌀 때({peBuckets[0]?.label}) 산 경우 PER 효과가 연 {sgn(peBuckets[0]?.pe ?? 0)}%p, 비쌀 때({peBuckets[peBuckets.length - 1]?.label})는 {sgn(peBuckets[peBuckets.length - 1]?.pe ?? 0)}%p였다.
          {nowB && <> 지금 구간({nowB.label})은 PER 효과 평균 {sgn(nowB.pe)}%p였고 수익률 대부분이 이익 성장(EPS 연 {sgn(nowB.eps)}%)에서 나왔다.</>}
          {' '}어느 구간이든 수익률의 대부분은 이익 성장이다.
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500">PER = 실제 종가 ÷ EPS(1993~1999년 종가는 트레이딩뷰, 2000년 이후는 Yahoo 월말 종가). 평균 수익률 ≈ EPS 효과 + PER 효과 + 배당(연 약 1.4%p).</p>

        <p className={`${p} pt-2 font-semibold`}>연말 PER 흐름 (1993~2025)</p>
        <PeTimelineChart timeline={peTimeline} peNow={peNow} />
        <p className={p}>
          1993~2007년에는 대체로 22~38배였다(1999년 46배는 예외, 2002년 22배가 가장 낮음). 2008~2018년에는 32~41배,
          2019~2025년에는 45~66배까지 올랐다(정점 2020년 66배).
          {lowSince ? <> 지금은 {peNow.toFixed(1)}배로 {lowSince[0]}년({lowSince[1].toFixed(0)}배) 이후 가장 낮다.</> : <> 지금은 {peNow.toFixed(1)}배로 기록 중 가장 낮다.</>}
        </p>
        {similar.length > 0 && (
          <p className={p}>
            지금과 비슷한 PER(±4배)에서 산 경우: {similar.map(d => `${d.buyYear}년(${d.peBuy.toFixed(0)}배) ${d.totalCagr.toFixed(1)}%`).join(' · ')}.
            다만 그 시기는 이익률이 24% → 41%로 오르고 PER도 올랐던 때라, 같은 결과를 기대하긴 어렵다(4번 참고).
          </p>
        )}
      </div>

      <DecompSection
        title="3-2. 연도별 수익률 분해 — 막대 하나 = EPS 몫 + 배당 몫 + PER 몫"
        decomp={buildDecomp(data)}
        divRows={(rmsDiv as any).rows}
        exampleYear={2012}
        noDivNote="1993~1999년 매수는 주가 출처(TradingView)가 달라 배당을 분리하지 못했다. 이 구간의 PER 몫에는 배당이 포함돼 있다(수익률 − EPS 몫)."
      />

      <div className={box}>
        <h4 className={h4}>3-3. 정리: 과거 성과를 만든 두 가지 순풍</h4>
        <ul className={`${p} list-disc pl-4 space-y-1`}>
          <li><b>EPS가 10년 동안 매년 {epsMin.toFixed(0)}~{epsMax.toFixed(0)}% 성장</b>했다({decomp.length}개 경우 중 최저 {epsMin.toFixed(0)}%). 하지만 2023년 이후는 연 1~2% 수준이다(2025년은 프랑스 특별 법인세로 감소).</li>
          <li><b>팔 때 PER이 대체로 올라 있었다.</b> {decomp.length}개 중 {peUp.length}개가 매수 때보다 높았고(예외: {peDownYears.join('·')}년 매수), 2010~2015년 매수는 팔 때 45~66배였다. PER 효과는 연 중간값 {sgn(peEffMed)}%p(배당 제외). 위 3-2 참고.</li>
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white pt-2">4. 앞으로</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500">4-1 이익이 얼마나 늘지 → 4-2 그 성장률과 10년 뒤 PER에 따른 예상 수익률</p>
      </div>

      <HermesForecast f={f} setF={setF} peNow={peNow} peFair={peFair} past10={past10} />

      <div className={box}>
        <ScenarioTable data={data} pe0={peNow} title="4-2. 지금 사서 10년 보유 시 예상 수익률 — EPS 성장률 × 10년 뒤 PER" />
      </div>

      <div className={box}>
        <h4 className={h4}>5. 결론</h4>
        <ul className={`${p} list-disc pl-4 space-y-1`}>
          <li><b>앞으로 EPS는 연 {gNow.toFixed(1)}% 안팎(±3%p)</b>이 중심이다(4번). 과거 18.8%는 이익률이 24% → 41%로 오른 덕이 커서 그대로 반복되긴 어렵다(3번).</li>
          <li>PER {peNow.toFixed(1)}배가 그대로면 10년 연 약 {ret10.toFixed(1)}%{retFair10 != null && <>, 거품기 뺀 중간값({peFair}배)으로 돌아가면 연 약 {retFair10.toFixed(1)}%</>}. 연 17~20%는 판매량 회복(낙관)과 PER 재평가가 함께 와야 나온다. EPS 성장률·10년 뒤 PER별 결과는 4-2 표.</li>
          <li><b>필요한 성장:</b> PER 지금 수준 유지·배당 1.35% 가정에서 연 17%가 나오려면 이익이 연 약 15%, 연 20%가 나오려면 연 약 18% 늘어야 한다. 과거 10년 이익 성장률({past10 ? <>연 {past10.min.toFixed(0)}~{past10.max.toFixed(0)}%, 중간값 {past10.med.toFixed(1)}%</> : '—'})로는 가능한 범위지만, 4번 중심값({gNow.toFixed(1)}%)보다 높다.</li>
          <li><b>매일 볼 것:</b> 2번 이익 시계 — 주가가 적정가 띠 아래면 싼 구간, 위면 비싼 구간.</li>
          <li><b>반기마다 볼 것:</b> 판매량(매출 성장 − 가격 인상)이 다시 늘어나는지, 영업이익률 41%가 유지되는지, 환율 영향을 뺀 매출 성장이 다시 두 자릿수로 오는지.</li>
        </ul>
      </div>

      <details className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <summary className={`${h4} cursor-pointer`}>부록. 과거 저점 직후 매수 vs 지금</summary>
        <div className="space-y-2 mt-2">

        <p className={p}>
          에르메스의 10년 수익률 바닥은 1999년 매수(연 7.8%)와 2000년 매수(연 13.7%)였다. 1999년은 PER이 비쌀 때(46배) 산 경우이고, 2000년(32배)은 PER보다 이후 몇 년간(2001~2004년) 이익이 거의 늘지 않은 탓이 컸다.
          그 바닥이 확인된 직후에 산 사람은 어땠을까?
        </p>
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr>
                <th className={`${th} text-left whitespace-nowrap`}>저점 구간</th>
                <th className={`${th} text-right whitespace-nowrap`}>그 구간 수익률</th>
                <th className={`${th} text-right whitespace-nowrap`}>저점 원인</th>
                <th className={`${th} text-right whitespace-nowrap`}>직후 매수 (PER)</th>
                <th className={`${th} text-right whitespace-nowrap`}>이후 10년 수익률</th>
                <th className={`${th} text-right whitespace-nowrap`}>이후 10년 EPS 성장</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <tr>
                <td className={`${td} whitespace-nowrap`}>1999 → 2009</td>
                <td className={`${td} text-right`}>7.8%</td>
                <td className={`${td} text-right whitespace-nowrap`}>PER 하락 46 → 34배 (이익은 연 +9.8%)</td>
                <td className={`${td} text-right whitespace-nowrap`}>2009년 말 (34.0배)</td>
                <td className={`${td} text-right font-semibold text-emerald-600 dark:text-emerald-400`}>23.4%</td>
                <td className={`${td} text-right`}>연 +18.2%</td>
              </tr>
              <tr>
                <td className={`${td} whitespace-nowrap`}>2000 → 2010</td>
                <td className={`${td} text-right`}>13.7%</td>
                <td className={`${td} text-right whitespace-nowrap`}>이익 정체 2001~2004년 (10년 이익 연 +9.7%, PER 32 → 39배)</td>
                <td className={`${td} text-right whitespace-nowrap`}>2010년 말 (39.3배)</td>
                <td className={`${td} text-right font-semibold text-emerald-600 dark:text-emerald-400`}>20.3%</td>
                <td className={`${td} text-right`}>연 +12.7%</td>
              </tr>
              <tr className="bg-blue-50 dark:bg-blue-900/20">
                <td className={`${td} whitespace-nowrap font-semibold`}>2019~2024년 매수 (진행 중)</td>
                <td className={`${td} text-right whitespace-nowrap`}>연 -25% ~ +12%</td>
                <td className={`${td} text-right whitespace-nowrap font-semibold text-purple-600 dark:text-purple-400`}>PER 하락 45~66배 → 지금</td>
                <td className={`${td} text-right whitespace-nowrap`}>지금 ({peNow.toFixed(1)}배)</td>
                <td className={`${td} text-right font-semibold`}>?</td>
                <td className={`${td} text-right`}>?</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul className={`${p} list-disc pl-4 space-y-1`}>
          <li><b>10년 완결 기준으로는 아직 바닥이 보이지 않는다.</b> 가장 최근 완결(2015년 매수)도 연 22%다.
            바닥은 아직 10년이 안 된 2019~2024년 매수에서 만들어지고 있다. PER 45~66배에 산 구간이라, 1999년(46배)처럼 낮은 10년 수익률로 끝날 가능성이 크다.</li>
          <li><b>저점의 원인이 과거와 같다.</b> 1999년처럼 이익은 늘었는데 PER이 떨어져서 수익률이 낮아진 경우다. 나이키(이익 정체가 원인)와 다른 점이다.</li>
          <li><b>지금 PER {peNow.toFixed(1)}배는 2009년 말(34.0배)보다 낮은 수준이다.</b> 그때 산 사람은 이후 10년간 연 23.4%를 냈다. 다만 그 10년은 이익이 연 18% 늘고, PER도 34배에서 45배로 올랐던 시기다.</li>
          <li><b>다른 점:</b> 2009년은 금융위기로 이익이 잠시 눌려 있던 때라 이후 반등 폭이 컸다. 지금은 이익이 높은 수준에서 성장만 멈춘 상태(2023년 이후 연 1~2%)다.</li>
        </ul>
      </div>
      </details>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        참고: PER은 모두 실제 종가(배당 미반영) ÷ EPS 기준이다. 1993~1999년 종가는 트레이딩뷰 월말 종가, 2000년 이후는 Yahoo 월말 종가다. 수익률은 배당을 재투자한 기준.
        EPS는 2001년 이후 회사 발표 기준(주당이익 또는 순이익÷주식 수)이고, 1996~2000년은 회사 순이익(2005 연차보고서), 1993~1994년은 당시 보도된 순이익을 2001년 주식 수로 나눠 환산했고, 1995년은 1994·1996년 사이 값으로 추정했다.
        참고용 분석이며 미래를 보장하지 않는다.
      </p>
    </div>
  )
}

// ── 나이키(NKE) 인사이트 (2026-10-21 분석, 정적 텍스트) ───────────
function NkeInsight({ data }: { data: StockData }) {
  const decomp = ((data as any).epsDecomp ?? []) as Decomp[]
  const box = 'rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-2'
  const h4 = 'text-sm font-semibold text-gray-800 dark:text-gray-100'
  const p = 'text-xs leading-relaxed text-gray-600 dark:text-gray-300'
  const th = 'py-1.5 px-2 font-medium text-gray-400 dark:text-gray-500'
  const td = 'py-1.5 px-2 tabular-nums text-gray-700 dark:text-gray-200'
  const sgn = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`
  const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length

  const peBuckets = [
    { label: '15배 미만', lo: 0, hi: 15 },
    { label: '15~20배 (지금 구간)', lo: 15, hi: 20, hl: true },
    { label: '20~25배', lo: 20, hi: 25 },
    { label: '25배 이상', lo: 25, hi: 999 },
  ].map(b => {
    const rows = decomp.filter(d => d.peBuy >= b.lo && d.peBuy < b.hi)
    const tot = rows.map(d => d.totalCagr)
    return {
      ...b,
      n: rows.length,
      avg: avg(tot),
      range: `${Math.min(...tot).toFixed(1)}~${Math.max(...tot).toFixed(1)}%`,
      eps: avg(rows.map(d => d.epsGrowthCagr)),
      pe: avg(rows.map(d => d.peCagr)),
      years: rows.map(d => d.buyYear).sort((x, y) => x - y),
    }
  }).filter(b => b.n > 0)

  const scenarioPEs = ['12배', '18배 (유지)', '24배']
  const scenarios = [
    { g: '연 0% (제자리)', v: ['0%', '4%', '7%'] },
    { g: '연 3%', v: ['3%', '8%', '11%'] },
    { g: '연 6% (2024년 이익 회복)', v: ['6%', '11%', '14%'], hl: true },
    { g: '연 9%', v: ['9%', '14%', '17%'] },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">인사이트</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500">2026년 10월 21일 기준 분석</p>
      </div>

      <div className={box}>
        <h4 className={h4}>1. 지금 한눈에 — PER 18배는 싸 보이지만, 주가 하락의 원인은 PER이 아니라 이익 감소</h4>
        <p className={p}>
          주가 37.5달러 ÷ 최근 1년 주당순이익(EPS) 2.08달러 = PER 약 18배. 에르메스는 이익은 그대로인데 PER이 떨어져서 주가가 빠졌지만,
          나이키는 최근 2년 동안 PER은 거의 그대로고 <b>이익 자체가 줄었다.</b>
        </p>
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr>
                <th className={`${th} text-left`}></th>
                <th className={`${th} text-right whitespace-nowrap`}>2021년 말 (정점)</th>
                <th className={`${th} text-right whitespace-nowrap`}>2024년 말</th>
                <th className={`${th} text-right`}>지금</th>
                <th className={`${th} text-right whitespace-nowrap`}>2024년 말 대비</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <tr><td className={td}>주가</td><td className={`${td} text-right`}>약 152</td><td className={`${td} text-right`}>약 72</td><td className={`${td} text-right`}>37.5</td><td className={`${td} text-right text-red-500 font-semibold`}>-48%</td></tr>
              <tr><td className={td}>EPS</td><td className={`${td} text-right`}>3.56</td><td className={`${td} text-right`}>3.73</td><td className={`${td} text-right`}>2.08</td><td className={`${td} text-right text-red-500 font-semibold`}>-44%</td></tr>
              <tr><td className={td}>PER</td><td className={`${td} text-right`}>42.8배</td><td className={`${td} text-right`}>19.3배</td><td className={`${td} text-right`}>18.0배</td><td className={`${td} text-right`}>-7%</td></tr>
            </tbody>
          </table>
        </div>
        <ul className={`${p} list-disc pl-4 space-y-1`}>
          <li>2021년 말 → 2024년 말 하락은 PER(43배 → 19배) 때문이었고, 2024년 말 이후 하락은 이익 감소 때문이다.</li>
          <li><b>이익이 더 줄어들 전망이다.</b> 2026년 10월 발표에서 회사는 2027 회계연도 조정 EPS를 1.15~1.35달러로 제시했다(매출은 한 자릿수 후반 감소).
            이 기준이면 지금 주가는 <b>내년 이익 대비 PER 28~33배</b>로, 결코 싸지 않다.</li>
          <li>배당수익률 4.3%(주당 약 1.6달러)는 높지만, 내년 예상 이익(1.15~1.35달러)보다 배당이 더 많다. 이익이 회복되지 않으면 배당이 유지될지 지켜봐야 한다.</li>
        </ul>
      </div>

      <StockValueClockByKey stockKey="NKE" rolling={data} title="2. 이익 시계 — 적정가 선 vs 주가" />

      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white pt-2">3. 과거에는 어땠나</h3>
        <p className={p}>매수 시점 PER에 따라 10년 수익률이 어떻게 달랐는지, 수익이 이익·배당·PER 중 어디서 나왔는지 본다.</p>
      </div>

      <div className={box}>
        <h4 className={h4}>3-1. 매수 시점 PER별 10년 연평균 수익률 ({decomp.length}개 경우)</h4>
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr>
                <th className={`${th} text-left whitespace-nowrap`}>매수 시 PER</th>
                <th className={`${th} text-right whitespace-nowrap`}>경우 수</th>
                <th className={`${th} text-right whitespace-nowrap`}>평균 수익률</th>
                <th className={`${th} text-right whitespace-nowrap`}>수익률 범위</th>
                <th className={`${th} text-right whitespace-nowrap`}>EPS 효과(평균)</th>
                <th className={`${th} text-right whitespace-nowrap`}>PER 효과(평균)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {peBuckets.map(b => (
                <tr key={b.label} className={b.hl ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                  <td className={`${td} whitespace-nowrap ${b.hl ? 'font-semibold' : ''}`}>{b.label}</td>
                  <td className={`${td} text-right`}>{b.n}</td>
                  <td className={`${td} text-right ${b.hl ? 'font-semibold' : ''}`}>{b.avg.toFixed(1)}%</td>
                  <td className={`${td} text-right whitespace-nowrap`}>{b.range}</td>
                  <td className={`${td} text-right`}>{sgn(b.eps)}%</td>
                  <td className={`${td} text-right font-semibold ${b.pe >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>{sgn(b.pe)}%p</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={p}>
          지금과 같은 15~20배 구간에서 산 경우({peBuckets.find(b => b.hl)?.years.join('·')}년)는 평균 연 17% 안팎이었다.
          다만 그때는 이후 10년 동안 이익이 매년 5~15% 늘었다. PER 20배 이상에서 산 경우는 PER이 내려오면서 수익률이 크게 낮았다.
        </p>
      </div>

      <DecompSection
        title="3-2. 연도별 수익률 분해 — 막대 하나 = EPS 몫 + 배당 몫 + PER 몫"
        decomp={buildDecomp(data)}
        divRows={(nkeDiv as any).rows}
        exampleYear={2011}
      />

      <div className={box}>
        <h4 className={h4}>3-3. 이익 성장이 계속 느려지고 있다</h4>
        <ul className={`${p} list-disc pl-4 space-y-1`}>
          <li><b>10년 EPS 성장률이 줄고 있다.</b> 2000~2012년 매수 구간은 일회성 요인이 낀 해(2008·2010년)를 빼면 대부분 연 12~15%였지만, 2013·2014년 매수는 연 9~10%, 2015년 매수는 연 1.6%로 떨어졌다.</li>
          <li>그 결과 2015년에 사서 10년 보유하면 연 1.5%에 그쳤다(배당 포함). 2016~2024년 매수는 아직 10년이 안 됐지만 지금 기준으로 모두 손실이다.</li>
          <li>과거 높은 수익을 낸 1984~1990년 매수(연 19~46%)는 대부분 PER 5~14배의 싼 값에 사서 이익이 폭발적으로 늘었던 시기다. 지금과는 출발점이 다르다.</li>
          <li>표의 ⚠ 표시는 세금 개혁(2017년), 코로나(2020년), 사업부 손상 등 일회성 요인으로 EPS가 크게 흔들린 해다. 이런 구간은 PER 몫이 부풀거나 줄어 보일 수 있다.</li>
        </ul>
      </div>

      <div className={box}>
        <h4 className={h4}>4. 앞으로 — 지금(PER 18배) 사서 10년 보유 시 예상 연평균 수익률</h4>
        <p className={p}>최근 1년 EPS 2.08달러, 배당수익률 4.3%가 유지된다고 가정. 행 = 연 EPS 성장률, 열 = 10년 뒤 PER.</p>
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr>
                <th className={`${th} text-left whitespace-nowrap`}>EPS 성장 ↓ / 10년 뒤 PER →</th>
                {scenarioPEs.map(pe => <th key={pe} className={`${th} text-right whitespace-nowrap`}>{pe}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {scenarios.map(s => (
                <tr key={s.g}>
                  <td className={`${td} whitespace-nowrap ${s.hl ? 'font-semibold' : ''}`}>{s.g}</td>
                  {s.v.map((v, i) => (
                    <td key={i} className={`${td} text-right ${s.hl && i === 1 ? 'bg-blue-50 dark:bg-blue-900/20 font-semibold' : ''}`}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={p}>
          연 6% 성장은 10년 뒤 EPS가 2024년 수준(3.73달러)으로 돌아오는 정도다. 내년 이익이 1.15~1.35달러로 더 줄어들면 출발점이 낮아져 이 표보다 결과가 나빠진다.
        </p>
      </div>

      <div className={box}>
        <h4 className={h4}>5. 결론</h4>
        <ul className={`${p} list-disc pl-4 space-y-1`}>
          <li><b>싸 보이는 건 착시다</b>(1번). 판단의 기준은 PER이 아니라 이익이 언제 다시 늘어나느냐다.</li>
          <li>이익이 2024년 수준으로만 회복돼도(연 6%) PER 유지 시 연 10~11% 정도. 배당 4.3%가 하단을 받쳐준다.</li>
          <li><b>필요한 성장:</b> 연 17%가 나오려면 PER 18배 유지·배당 4.3% 가정에서 이익이 10년간 연 약 12%씩 늘어야 한다(2.08 → 약 6.5달러). EPS 최고치는 3.73달러(2024년)였고, 2016년(2.16달러)부터 10년간 제자리였다.</li>
          <li>이익 회복이 늦어지면 연 4~8% 수준에 머물 수 있다. 앞으로 볼 것은 <b>매출 감소가 멈추고 EPS가 다시 늘어나는지</b>, 그리고 <b>배당이 유지되는지</b>다(분기 매출이 플러스로 돌아서는지, 2027 회계연도 이후 EPS가 다시 늘어나는지).</li>
        </ul>
      </div>

      <details className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <summary className={`${h4} cursor-pointer`}>부록. 과거 저점 직후 매수 vs 지금</summary>
        <div className="space-y-2 mt-2">
        <p className={p}>
          10년 수익률이 바닥을 찍은 직후에 산 사람은 과거 두 번 모두 연 16~18%를 냈다. 지금(2015년 매수 연 1.5%, 역대 최저)도 그럴까?
        </p>
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr>
                <th className={`${th} text-left whitespace-nowrap`}>저점 구간</th>
                <th className={`${th} text-right whitespace-nowrap`}>그 구간 수익률</th>
                <th className={`${th} text-right whitespace-nowrap`}>저점 원인</th>
                <th className={`${th} text-right whitespace-nowrap`}>직후 매수 (PER)</th>
                <th className={`${th} text-right whitespace-nowrap`}>이후 10년 수익률</th>
                <th className={`${th} text-right whitespace-nowrap`}>이후 10년 EPS 성장</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <tr>
                <td className={`${td} whitespace-nowrap`}>1992 → 2002</td>
                <td className={`${td} text-right`}>8.3%</td>
                <td className={`${td} text-right whitespace-nowrap`}>PER 하락 (이익은 연 +8.7%)</td>
                <td className={`${td} text-right whitespace-nowrap`}>2002년 말 (13배)</td>
                <td className={`${td} text-right font-semibold text-emerald-600 dark:text-emerald-400`}>17.9%</td>
                <td className={`${td} text-right`}>연 +14.4%</td>
              </tr>
              <tr>
                <td className={`${td} whitespace-nowrap`}>1996 → 2006</td>
                <td className={`${td} text-right`}>5.7%</td>
                <td className={`${td} text-right whitespace-nowrap`}>PER 하락 (이익은 연 +10.9%)</td>
                <td className={`${td} text-right whitespace-nowrap`}>2006년 말 (14배) · 2007년 말 (17배)</td>
                <td className={`${td} text-right font-semibold text-emerald-600 dark:text-emerald-400`}>16.8% · 16.2%</td>
                <td className={`${td} text-right`}>연 +12.6% · +13.1%</td>
              </tr>
              <tr className="bg-blue-50 dark:bg-blue-900/20">
                <td className={`${td} whitespace-nowrap font-semibold`}>2015 → 2025</td>
                <td className={`${td} text-right`}>1.5%</td>
                <td className={`${td} text-right whitespace-nowrap font-semibold text-red-500`}>이익 정체 (연 +1.6%)</td>
                <td className={`${td} text-right whitespace-nowrap`}>지금 (18배, 내년 기준 28~33배)</td>
                <td className={`${td} text-right font-semibold`}>?</td>
                <td className={`${td} text-right`}>?</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul className={`${p} list-disc pl-4 space-y-1`}>
          <li><b>저점 매수가 유리하다는 방향은 맞다.</b> 10년 수익률이 바닥이면 기대와 가격이 낮아진 상태라, 이후 수익이 좋아질 여지가 크다.</li>
          <li><b>하지만 저점의 원인이 반대다.</b> 과거 두 번은 이익이 잘 늘었는데 PER만 떨어진 것이라, PER이 회복되며 반등했다.
            이번에는 PER은 그대로고 이익이 10년간 제자리였다. 이익 정체는 PER처럼 저절로 돌아오지 않고, 사업이 회복돼야 풀린다.</li>
          <li><b>출발점도 다르다.</b> 과거에는 PER 13~17배에 샀고 이후 이익이 연 13~14% 늘었다. 지금은 PER 18배인데 내년 이익이 더 줄 전망이다.</li>
          <li>과거 사례가 두 번뿐이라 패턴으로 확신하기엔 표본이 적다.</li>
        </ul>
      </div>
      </details>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        참고: 나이키 회계연도는 5월 말 결산이며, 표의 연도별 EPS는 회계연도 기준이다. 1980년대 일부 EPS는 추정값이다.
        2027 회계연도 전망은 언론 보도(2026년 10월 1일 실적 발표) 기준이며 회사 발표 자료와 대조가 필요하다. 참고용 분석이며 미래를 보장하지 않는다.
      </p>
    </div>
  )
}

// ── 전 종목 자동 인사이트 (사업성 평가 + EDGAR EPS 기반 숫자 분석) ─────────
let qualityCache: Promise<Record<string, Quality>> | null = null
function loadQuality() {
  if (!qualityCache) {
    qualityCache = fetch('/data/fundamentals/_quality.json')
      .then(r => r.json()).then(j => j.stocks as Record<string, Quality>)
      .catch(() => ({}))
  }
  return qualityCache
}

type Fundamentals = {
  eps: Record<string, number | null>
  pe: Record<string, number | null>
  decomp: Array<Decomp & { divCagr: number | null; priceCagr: number | null }>
  metrics: Metrics
  generated: string
}

// ── 위대한 기업 개별 분석 (deep.ts) — 1·4·5번 섹션 안에 들어감 ─────────
const DEEP_LAB = 'text-xs font-semibold text-amber-700 dark:text-amber-400'
const DEEP_P = 'text-xs leading-relaxed text-gray-700 dark:text-gray-200'

function DeepNow({ d }: { d: DeepInsight }) {
  return (
    <div className="rounded bg-amber-50/70 dark:bg-amber-950/20 p-3 space-y-1">
      <p className={DEEP_LAB}>지금 무슨 일이 있나 — 개별 분석 ({d.asOf})</p>
      <ul className={`${DEEP_P} list-disc pl-4 space-y-1`}>{d.now.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </div>
  )
}

function DeepFuture({ d, num }: { d: DeepInsight; num: string }) {
  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 p-4 space-y-2">
      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{num} 앞으로 이익을 움직일 것 — 개별 분석</h4>
      <ul className={`${DEEP_P} list-disc pl-4 space-y-1`}>
        {d.drivers.map(x => <li key={x.k}><b>{x.k}:</b> {x.v}</li>)}
      </ul>
      <div className="rounded bg-amber-50/70 dark:bg-amber-950/20 p-3">
        <p className={DEEP_P}>
          <b>판단: 앞으로 10년 EPS 연 {d.growth.base}%</b> (범위 {d.growth.lo}~{d.growth.hi}%). {d.growth.why}
        </p>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">이 값이 2번 이익 시계 성장률 바의 기본값(&lsquo;개별 분석 판단&rsquo; 눈금)이다.</p>
      </div>
    </div>
  )
}

function DeepConclusion({ d, num, auto }: { d: DeepInsight; num: string; auto: string[] }) {
  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 p-4 space-y-2">
      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{num} 결론</h4>
      <ul className={`${DEEP_P} list-disc pl-4 space-y-1`}>{d.verdict.map((t, i) => <li key={i}>{t}</li>)}</ul>
      <p className={DEEP_LAB}>확인할 것</p>
      <ul className={`${DEEP_P} list-disc pl-4 space-y-0.5`}>{d.watch.map((t, i) => <li key={i}>{t}</li>)}</ul>
      {auto.length > 0 && (<>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 pt-1">숫자로 본 근거 (자동 계산)</p>
        <ul className="text-xs leading-relaxed text-gray-600 dark:text-gray-300 list-disc pl-4 space-y-1">{auto.map((t, i) => <li key={i}>{t}</li>)}</ul>
      </>)}
      <p className="text-[11px] text-gray-400 dark:text-gray-500">개별 분석은 {d.asOf} 기준 실적 발표·보도를 바탕으로 쓴 판단이다. 숫자는 위 자동 계산과 함께 본다.</p>
    </div>
  )
}

function WrittenInsightBox({ stockKey }: { stockKey: string }) {
  const w = WRITTEN_INSIGHTS[stockKey]
  if (!w) return null
  return (
    <div className="rounded-lg border-2 border-amber-200 dark:border-amber-900/60 p-4 space-y-3">
      <div>
        <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">Claude 직접 분석 · {WRITTEN_AS_OF}</p>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{w.headline}</h4>
      </div>
      {w.sections.map(sec => (
        <div key={sec.title} className="space-y-1">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{sec.title}</p>
          <ul className="text-xs leading-relaxed text-gray-600 dark:text-gray-300 list-disc pl-4 space-y-0.5">
            {sec.items.map((it, i) => <li key={i}>{it}</li>)}
          </ul>
        </div>
      ))}
      <p className="text-[11px] text-gray-400 dark:text-gray-500">뉴스와 공시 숫자를 바탕으로 쓴 판단이다. 자세한 수치는 아래 자동 분석 참고.</p>
    </div>
  )
}

function ScoreBar({ label, v }: { label: string; v: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 shrink-0 text-gray-500 dark:text-gray-400">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} className={`h-2 w-5 rounded-sm ${i <= v ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
        ))}
      </div>
      <span className="tabular-nums text-gray-600 dark:text-gray-300">{v}</span>
    </div>
  )
}

function QualityCard({ stockKey }: { stockKey: string }) {
  const [q, setQ] = useState<Quality | null | undefined>(undefined)
  useEffect(() => { loadQuality().then(all => setQ(all[stockKey] ?? null)) }, [stockKey])
  if (!q) return null
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">사업성 평가</h4>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${gradeColor(q.grade)}`}>{q.grade} · {GRADE_LABEL[q.grade]}</span>
        <span className="text-xs text-gray-400">점수 합 {qualityScore(q)} / 25</span>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-300"><b>사업:</b> {q.business}</p>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
        <ScoreBar label="경쟁우위(해자)" v={q.moat} />
        <ScoreBar label="가격결정력" v={q.pricing} />
        <ScoreBar label="수익성" v={q.profit} />
        <ScoreBar label="성장성" v={q.growth} />
        <ScoreBar label="지속가능성" v={q.durability} />
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-300"><b className="text-emerald-600 dark:text-emerald-400">강점:</b> {q.strength}</p>
      <p className="text-xs text-gray-600 dark:text-gray-300"><b className="text-red-500">위험:</b> {q.risk}</p>
      <p className="text-[11px] text-gray-400 dark:text-gray-500">
        버핏·멍거식 기준(오래가는 경쟁우위, 가격을 올려도 고객이 떠나지 않는 힘, 높은 이익률, 성장 여력, 10년 뒤에도 건재할지)으로 Claude가 매긴 정성 평가다. 2026년 10월 기준이며 투자 판단의 참고용이다.
      </p>
    </div>
  )
}

// ── 자동 심화 분석: PER별 과거 수익률 · 과거 저점 비교 · 시나리오 · 자동 결론 ─────────
// part: 섹션별로 나눠 그림 (pastPe 3-3 · future 4 · conclusion 5 · appendix 부록), num: 섹션 번호
function AutoDeep({ f, data, part, num = '', deep }: { f: Fundamentals; data: StockData; part: 'pastPe' | 'future' | 'conclusion' | 'appendix'; num?: string; deep?: DeepInsight }) {
  const box = 'rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-2'
  const h4 = 'text-sm font-semibold text-gray-800 dark:text-gray-100'
  const p = 'text-xs leading-relaxed text-gray-600 dark:text-gray-300'
  const th = 'py-1.5 px-2 font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap'
  const td = 'py-1.5 px-2 tabular-nums text-gray-700 dark:text-gray-200 whitespace-nowrap'
  const sgn = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`
  const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length

  const m = f.metrics
  const curPe = m.pe
  const div = m.divYield ?? 0
  const complete = f.decomp.filter(d => !d.inProgress && d.peBuy != null && d.peBuy > 0 && d.peBuy < 150)
  const byPe = [...complete].sort((a, b) => a.peBuy - b.peBuy)

  // 지금과 비슷한 PER(±20%)에서 산 경우
  const similar = curPe ? complete.filter(d => d.peBuy >= curPe * 0.8 && d.peBuy <= curPe * 1.2) : []
  const cheaper = curPe ? complete.filter(d => d.peBuy < curPe * 0.8) : []
  const pricier = curPe ? complete.filter(d => d.peBuy > curPe * 1.2) : []

  // 10년 PER 범위
  const peHist = Object.entries(f.pe)
    .filter(([y, v]) => v != null && v > 0 && v < 150 && Number(y) >= m.lastFy - 10)
    .map(([, v]) => v as number).sort((a, b) => a - b)
  const peMin = peHist.length ? peHist[0] : null
  const peMax = peHist.length ? peHist[peHist.length - 1] : null

  // 과거 저점 (주가 롤링 데이터: EPS 없이도 긴 역사)
  const rows = (data.rows10y as any[]).filter(r => r.isComplete)
  const rowByBuy = new Map((data.rows10y as any[]).map(r => [r.buyYear, r]))
  const troughs = [...rows].sort((a, b) => a.cagr - b.cagr)
    .filter(r => rowByBuy.has(r.sellYear))
    .slice(0, 3)
  const latest = rows.length ? rows[rows.length - 1] : null
  const latestRank = latest ? [...rows].sort((a, b) => a.cagr - b.cagr).findIndex(r => r.buyYear === latest.buyYear) + 1 : 0
  const epsGrowthAfter = (buy: number) => f.decomp.find(d => d.buyYear === buy && !d.inProgress)?.epsGrowthCagr ?? null

  // 시나리오
  const growths = [0, 3, 6, 9, 12, 15]
  const exits = curPe ? Array.from(new Set([
    peMin != null ? Math.round(peMin) : null,
    Math.round(curPe),
    m.peMed10 != null ? Math.round(m.peMed10) : null,
    peMax != null ? Math.round(Math.min(peMax, 80)) : null,
  ].filter((v): v is number => v != null && v > 0))).sort((a, b) => a - b) : []
  const ret = (g: number, exit: number) =>
    curPe ? ((Math.pow(1 + g / 100, 10) * exit / curPe) ** 0.1 * (1 + div / 100) - 1) * 100 : 0
  const needFor = (target: number, exit: number) =>
    curPe ? (((1 + target / 100) / (1 + div / 100)) / Math.pow(exit / curPe, 0.1) - 1) * 100 : null
  const exitMed = m.peMed10 ?? curPe
  const need15 = exitMed ? needFor(15, exitMed) : null
  const need10 = exitMed ? needFor(10, exitMed) : null
  const histG = [m.epsCagr10, m.epsCagr5].filter((v): v is number => v != null)
  const histLow = histG.length ? Math.min(...histG) : null

  const cell = (v: number) =>
    v < 0 ? 'text-red-500' : v < 5 ? 'text-orange-500' : v < 10 ? 'text-yellow-600 dark:text-yellow-400'
      : v < 15 ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400 font-semibold'

  // 자동 결론: 1번(지금 한눈에)에 없는 판단만 — 목표 수익률에 필요한 성장, 비슷한 PER의 과거 결과, 최근 수익률 순위
  const concl: string[] = []
  if (need15 != null && histLow != null) {
    concl.push(`PER이 평소 수준으로 돌아간다고 보면, 연 15%를 내려면 이익이 연 ${need15.toFixed(0)}%씩 늘어야 한다. 과거 이익 성장률(5년·10년 중 낮은 값)은 연 ${histLow.toFixed(0)}%로 ${histLow >= need15 ? '과거 속도만 유지해도 가능한 수준' : '과거보다 빨라야 하는 수준'}이다.`)
  }
  if (similar.length) {
    concl.push(`지금과 비슷한 PER(±20%)에서 산 ${similar.length}번의 10년 결과는 평균 연 ${avg(similar.map(d => d.totalCagr)).toFixed(1)}% (${Math.min(...similar.map(d => d.totalCagr)).toFixed(1)}~${Math.max(...similar.map(d => d.totalCagr)).toFixed(1)}%).`)
  }
  if (latest && rows.length >= 5) {
    concl.push(`가장 최근 완결 구간(${latest.buyYear}→${latest.sellYear}) 연 ${latest.cagr.toFixed(1)}%는 과거 ${rows.length}개 중 ${latestRank}번째로 낮다${latestRank <= Math.max(2, rows.length * 0.2) ? ' — 10년 수익률이 바닥권이다.' : '.'}`)
  }

  if (part === 'conclusion' && deep) return <DeepConclusion d={deep} num={num} auto={concl} />

  return (
    <>
      {part === 'pastPe' && curPe != null && complete.length > 0 && (
        <div className={box}>
          <h4 className={h4}>{num} 매수 시점 PER별 과거 10년 수익률 ({complete.length}개 경우)</h4>
          <div className="overflow-x-auto">
            <table className="text-xs">
              <thead>
                <tr>
                  <th className={`${th} text-left`}>보유 구간</th>
                  <th className={`${th} text-right`}>매수 해 EPS</th>
                  <th className={`${th} text-right`}>매수 PER</th>
                  <th className={`${th} text-right`}>10년 연평균</th>
                  <th className={`${th} text-right`}>EPS 성장(연)</th>
                  <th className={`${th} text-right`}>PER 변화</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(() => {
                  const out: React.ReactNode[] = []
                  let marked = false
                  byPe.forEach(d => {
                    if (!marked && d.peBuy > curPe) {
                      out.push(
                        <tr key="now" className="bg-blue-50 dark:bg-blue-900/20">
                          <td className={`${td} font-semibold`} colSpan={3}>▶ 지금 PER {curPe.toFixed(1)}배{m.ttmEps != null ? ` · 최근 1년 EPS ${m.ttmEps.toFixed(2)}` : ''}</td>
                          <td className={`${td} text-right`} colSpan={3}>?</td>
                        </tr>)
                      marked = true
                    }
                    out.push(
                      <tr key={d.buyYear}>
                        <td className={td}>{d.buyYear} → {d.sellYear}</td>
                        <td className={`${td} text-right`}>{fmt(f.eps[String(d.buyYear)], 2)}</td>
                        <td className={`${td} text-right`}>{d.peBuy.toFixed(1)}배</td>
                        <td className={`${td} text-right font-semibold ${cell(d.totalCagr)}`}>{d.totalCagr.toFixed(1)}%</td>
                        <td className={`${td} text-right`}>{sgn(d.epsGrowthCagr)}%</td>
                        <td className={`${td} text-right`}>{d.peBuy.toFixed(0)} → {d.peSell.toFixed(0)}배</td>
                      </tr>)
                  })
                  if (!marked) out.push(
                    <tr key="now" className="bg-blue-50 dark:bg-blue-900/20">
                      <td className={`${td} font-semibold`} colSpan={3}>▶ 지금 PER {curPe.toFixed(1)}배{m.ttmEps != null ? ` · 최근 1년 EPS ${m.ttmEps.toFixed(2)}` : ''}</td>
                      <td className={`${td} text-right`} colSpan={3}>?</td>
                    </tr>)
                  return out
                })()}
              </tbody>
            </table>
          </div>
          <ul className={`${p} list-disc pl-4 space-y-0.5`}>
            {cheaper.length > 0 && <li>지금보다 20% 이상 싸게 산 경우({cheaper.length}번): 평균 연 {avg(cheaper.map(d => d.totalCagr)).toFixed(1)}%</li>}
            {similar.length > 0 && <li>지금과 비슷한 PER(±20%)에서 산 경우({similar.length}번): 평균 연 {avg(similar.map(d => d.totalCagr)).toFixed(1)}%</li>}
            {pricier.length > 0 && <li>지금보다 20% 이상 비싸게 산 경우({pricier.length}번): 평균 연 {avg(pricier.map(d => d.totalCagr)).toFixed(1)}%</li>}
          </ul>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            SEC 공시 EPS가 2008년 무렵부터 있어 10년을 다 채운 경우가 적다. 경우 수가 적으면 참고 정도로만 보자.
          </p>
        </div>
      )}

      {part === 'appendix' && troughs.length > 0 && (
        <details className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <summary className={`${h4} cursor-pointer`}>부록. 과거 10년 수익률 바닥 직후에 샀다면</summary>
          <div className="space-y-2 mt-2">
          <p className={p}>10년 보유 수익률이 가장 낮았던 구간과, 그 구간이 끝난 해 말에 새로 산 경우의 결과(주가 기록 기준).</p>
          <div className="overflow-x-auto">
            <table className="text-xs">
              <thead>
                <tr>
                  <th className={`${th} text-left`}>바닥 구간</th>
                  <th className={`${th} text-right`}>그 구간 수익률</th>
                  <th className={`${th} text-right`}>직후 매수</th>
                  <th className={`${th} text-right`}>이후 수익률</th>
                  <th className={`${th} text-right`}>이후 EPS 성장</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {troughs.map(t => {
                  const after = rowByBuy.get(t.sellYear)
                  const eg = epsGrowthAfter(t.sellYear)
                  return (
                    <tr key={t.buyYear}>
                      <td className={td}>{t.buyYear} → {t.sellYear}</td>
                      <td className={`${td} text-right ${cell(t.cagr)}`}>{t.cagr.toFixed(1)}%</td>
                      <td className={`${td} text-right`}>
                        {t.sellYear}년 말{f.pe[String(t.sellYear)] ? ` (PER ${f.pe[String(t.sellYear)]!.toFixed(0)}배)` : ''}
                      </td>
                      <td className={`${td} text-right font-semibold ${cell(after.cagr)}`}>
                        {after.cagr.toFixed(1)}%{after.isComplete ? '' : ` (${after.yearsActual}년, 진행 중)`}
                      </td>
                      <td className={`${td} text-right`}>{eg != null ? `연 ${sgn(eg)}%` : '—'}</td>
                    </tr>
                  )
                })}
                {latest && (
                  <tr className="bg-blue-50 dark:bg-blue-900/20">
                    <td className={`${td} font-semibold`}>{latest.buyYear} → {latest.sellYear} (최근)</td>
                    <td className={`${td} text-right ${cell(latest.cagr)}`}>{latest.cagr.toFixed(1)}%</td>
                    <td className={`${td} text-right`}>지금{curPe ? ` (PER ${curPe.toFixed(0)}배)` : ''}</td>
                    <td className={`${td} text-right font-semibold`}>?</td>
                    <td className={`${td} text-right`}>?</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            바닥 직후 매수가 좋았던 건 대개 그 뒤 이익이 잘 늘었기 때문이다. 바닥의 원인이 PER 하락이었는지, 이익 정체였는지 함께 봐야 한다.
          </p>
          </div>
        </details>
      )}

      {part === 'future' && curPe != null && exits.length > 0 && (
        <div className={box}>
          <h4 className={h4}>{num} 앞으로 — 지금(PER {curPe.toFixed(1)}배) 사서 10년 보유 시 예상 연평균 수익률</h4>
          <p className={p}>배당수익률 {div.toFixed(2)}% 유지 가정. 행 = 연 EPS 성장률, 열 = 10년 뒤 PER(10년 최저·지금·중간값·최고).</p>
          <div className="overflow-x-auto">
            <table className="text-xs">
              <thead>
                <tr>
                  <th className={`${th} text-left`}>EPS 성장 ↓ / 10년 뒤 PER →</th>
                  {exits.map(e => (
                    <th key={e} className={`${th} text-right`}>
                      {e}배{e === Math.round(curPe) ? ' (지금)' : e === Math.round(m.peMed10 ?? -1) ? ' (평소)' : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {growths.map(g => (
                  <tr key={g} className={histLow != null && Math.abs(g - histLow) < 1.5 ? 'bg-gray-50 dark:bg-gray-800/40' : ''}>
                    <td className={td}>연 {g}%</td>
                    {exits.map(e => {
                      const v = ret(g, e)
                      return <td key={e} className={`${td} text-right ${cell(v)}`}>{v.toFixed(1)}%</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            {need10 != null && need15 != null && `PER이 평소(${exitMed!.toFixed(0)}배)로 돌아갈 때 연 10%에는 이익 연 ${need10.toFixed(0)}%, 연 15%에는 연 ${need15.toFixed(0)}% 성장이 필요하다. `}
            계산식: [(1+EPS 성장)^10 × (10년 뒤 PER ÷ 지금 PER)]^(1/10) × (1+배당) − 1.
          </p>
        </div>
      )}

      {part === 'conclusion' && concl.length > 0 && (
        <div className={box}>
          <h4 className={h4}>{num} 결론 — 숫자로 본 판단</h4>
          <ul className={`${p} list-disc pl-4 space-y-1`}>
            {concl.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">데이터로 자동 작성한 문장이다. 사업 측면 판단은 위 사업성 평가와 함께 보자.</p>
        </div>
      )}
    </>
  )
}

function AutoInsight({ stockKey, data }: { stockKey: string; data: StockData }) {
  const [f, setF] = useState<Fundamentals | null | undefined>(undefined)
  const [q, setQ] = useState<Quality | undefined>(undefined)
  useEffect(() => {
    let alive = true
    setF(undefined)
    fetch(`/data/fundamentals/${stockKey}.json`)
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (alive) setF(j) })
      .catch(() => { if (alive) setF(null) })
    loadQuality().then(all => { if (alive) setQ(all[stockKey]) })
    return () => { alive = false }
  }, [stockKey])

  const box = 'rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-2'
  const h4 = 'text-sm font-semibold text-gray-800 dark:text-gray-100'
  const p = 'text-xs leading-relaxed text-gray-600 dark:text-gray-300'
  const th = 'py-1.5 px-2 font-medium text-gray-400 dark:text-gray-500'
  const td = 'py-1.5 px-2 tabular-nums text-gray-700 dark:text-gray-200'

  if (f === undefined) return <p className="text-xs text-gray-400">인사이트 불러오는 중…</p>
  const deep = DEEP_INSIGHTS[stockKey]

  const header = (
    <div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">인사이트</h3>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        자동 분석{f ? ` · 데이터 ${f.generated}` : ''} · EPS는 SEC 공시(10-K) 기준{deep ? ` · 개별 분석 ${deep.asOf}` : ''}
      </p>
      {deep && <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mt-1">{deep.headline}</p>}
    </div>
  )

  if (!f) {
    return (
      <div className="space-y-4">
        {header}
        <QualityCard stockKey={stockKey} />
        <p className="text-xs text-gray-400">이 종목은 연도별 EPS 공시 데이터를 찾지 못해 숫자 분석을 생략했다.</p>
        {deep && (<>
          <div className={box}><h4 className={h4}>1. 지금 한눈에</h4><DeepNow d={deep} /></div>
          <DeepFuture d={deep} num="2." />
          <DeepConclusion d={deep} num="3." auto={[]} />
        </>)}
      </div>
    )
  }

  const m = f.metrics
  const group = classify(m, q)
  const years = Object.keys(f.pe).map(Number).sort((a, b) => a - b).slice(-6)
  const decomp = f.decomp.filter(d => !d.inProgress || (d.years ?? 0) >= 9)
  const divRows = decomp.filter(d => d.divCagr != null).map(d => ({
    buyYear: d.buyYear, priceCagr: d.priceCagr ?? 0, totalCagr: d.totalCagr, divCagr: d.divCagr as number,
  }))
  const complete = decomp.filter(d => !d.inProgress)
  const exampleYear = complete.length ? complete[complete.length - 1].buyYear : (decomp[0]?.buyYear ?? 0)

  // 3년 전 대비 무엇이 움직였나 (연말 기준)
  const y0 = years.length >= 4 ? years[years.length - 4] : years[0]
  const pe0 = y0 != null ? f.pe[String(y0)] : null
  const eps0 = y0 != null ? f.eps[String(y0)] : null
  const epsChg = eps0 && m.ttmEps && eps0 > 0 ? (m.ttmEps / eps0 - 1) * 100 : null
  const peChg = pe0 && m.pe ? (m.pe / pe0 - 1) * 100 : null

  const lines: string[] = []
  if (m.pe != null && m.peMed10 != null) {
    lines.push(`현재 PER ${m.pe.toFixed(1)}배는 최근 10년 연말 PER 중간값(${m.peMed10.toFixed(1)}배)의 ${(m.peVsMed! * 100).toFixed(0)}% 수준이다.`)
  }
  if (epsChg != null && peChg != null && y0 != null) {
    const main = Math.abs(epsChg) > Math.abs(peChg) ? '이익(EPS) 변화' : 'PER 변화'
    lines.push(`${y0}년 말 이후 EPS ${fmtSgn(epsChg, 0)}, PER ${fmtSgn(peChg, 0)} → 주가를 움직인 건 주로 ${main}다.`)
  }
  if (m.epsCagr10 != null) {
    lines.push(`EPS는 10년간 연 ${fmtSgn(m.epsCagr10)}${m.epsCagr5 != null ? `, 최근 5년 연 ${fmtSgn(m.epsCagr5)}` : ''} 늘었고, 10년 중 ${m.epsDownYears10}번 감소했다.`)
  }
  if (m.epsVsPeak != null) {
    lines.push(m.epsVsPeak >= 0.95 ? '최근 1년 이익은 10년 내 최고 수준이다.'
      : m.epsVsPeak < 0.85 ? `최근 1년 이익은 10년 내 고점의 ${(m.epsVsPeak * 100).toFixed(0)}%라 PER이 실제보다 높아 보인다. 이익 회복이 먼저다(고점 해에 일회성 이익이 있었다면 왜곡일 수 있다).`
      : `최근 1년 이익은 10년 내 고점의 ${(m.epsVsPeak * 100).toFixed(0)}% 수준이다.`)
  }

  // 섹션 번호: 에르메스·나이키와 같은 틀 (1 지금 → 2 이익 시계 → 3 과거 → 4 앞으로 → 5 결론 → 부록)
  // 공시 EPS가 오래된 종목은 이익 시계·앞으로·결론이 빠져 번호를 당겨 매김
  const live = !m.stale
  let sec = 1
  const nNow = sec++
  const nClock = live ? sec++ : 0
  const nPast = sec++
  const nFuture = live || deep ? sec++ : 0
  const nConcl = live || deep ? sec++ : 0
  let sub = 1
  const nDecomp = decomp.length > 0 ? `${nPast}-${sub++}.` : ''
  const nPastPe = `${nPast}-${sub++}.`
  const h3 = 'text-sm font-semibold text-gray-900 dark:text-white pt-2'

  return (
    <div className="space-y-4">
      {header}
      {!deep && <WrittenInsightBox stockKey={stockKey} />}
      <QualityCard stockKey={stockKey} />

      <div className={box}>
        <div className="flex flex-wrap items-center gap-2">
          <h4 className={h4}>{nNow}. 지금 한눈에</h4>
          {group && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${groupColor(group)}`}>{GROUPS[group].label}</span>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard label="현재 PER" value={m.pe != null ? `${m.pe.toFixed(1)}배` : '—'} />
          <StatCard label="10년 중간 PER" value={m.peMed10 != null ? `${m.peMed10.toFixed(1)}배` : '—'} />
          <StatCard label="EPS 10년 성장(연)" value={fmtSgn(m.epsCagr10)} />
          <StatCard label="3년 고점 대비 주가" value={fmtSgn(m.fromHigh3y, 0)} />
          <StatCard label="이익 / 10년 고점" value={m.epsVsPeak != null ? `${(m.epsVsPeak * 100).toFixed(0)}%` : '—'} />
          <StatCard label="배당수익률" value={fmt(m.divYield, 2, '%')} />
          <StatCard label="1년 주가 변화" value={fmtSgn(m.chg1y, 0)} />
        </div>
        {m.stale && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            SEC 공시에서 찾은 EPS가 {m.lastFy}년까지만 있어 PER 비교·성장률·기대수익률은 생략했다.
          </p>
        )}
        {deep && <DeepNow d={deep} />}
        {deep && <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 pt-1">숫자로 보면 (자동 계산)</p>}
        <ul className={`${p} list-disc pl-4 space-y-1`}>
          {lines.map((l, i) => <li key={i}>{l}</li>)}
          {group && <li><b>{GROUPS[group].label}:</b> {GROUPS[group].desc}</li>}
        </ul>
      </div>

      {live && <StockValueClock f={f as ClockFund} stockKey={stockKey} rolling={data} title={`${nClock}. 이익 시계 — 적정가 선 vs 주가`} judged={deep?.growth} />}

      <div className="space-y-1">
        <h3 className={h3}>{nPast}. 과거에는 어땠나</h3>
        <p className={p}>10년 보유 수익이 이익·배당·PER 중 어디서 나왔는지, 매수 시점 PER에 따라 결과가 어떻게 달랐는지 본다.</p>
      </div>


      {decomp.length > 0 && (
        <DecompSection
          title={`${nDecomp} 연도별 수익률 분해 — 막대 하나 = EPS 몫 + 배당 몫 + PER 몫`}
          decomp={decomp}
          divRows={divRows}
          exampleYear={exampleYear}
        />
      )}

      {live && <AutoDeep f={f} data={data} part="pastPe" num={nPastPe} />}
      {deep && (
        <div className="space-y-1">
          <h3 className={h3}>{nFuture}. 앞으로</h3>
        </div>
      )}
      {deep && <DeepFuture d={deep} num={`${nFuture}-1.`} />}
      {live && <AutoDeep f={f} data={data} part="future" num={deep ? `${nFuture}-2.` : `${nFuture}.`} />}
      {live && <AutoDeep f={f} data={data} part="conclusion" num={`${nConcl}.`} deep={deep} />}
      {!live && deep && <DeepConclusion d={deep} num={`${nConcl}.`} auto={[]} />}
      {live && <AutoDeep f={f} data={data} part="appendix" />}
    </div>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────────
export default function PrivatePage() {
  const [activeStock, setActiveStock] = useState(0)
  const current = STOCKS[activeStock]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        <PrivateTabs active="stocks" />

        {/* ── 사용 방법 ── */}
        <section className="rounded-xl border-2 border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 p-4 space-y-3">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">사용 방법 — 종목 하나를 깊게 보는 곳</h2>
          <ol className="space-y-2.5 text-sm text-gray-700 dark:text-gray-200">
            <li className="flex gap-2">
              <span className="shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
              <div>
                <b>종목을 고른다.</b>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  아래 &lsquo;종목 비교 개요&rsquo; 표에서 행을 누르거나 &lsquo;종목 선택&rsquo; 목록에서 고른다. 어떤 종목을 볼지 모르겠다면 위 &lsquo;종목 아이디어&rsquo; 탭에서 추천 목록부터 보자.
                </p>
              </div>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</span>
              <div>
                <b>차트와 표로 &lsquo;과거에 샀다면&rsquo;을 본다.</b>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  막대 하나 = 그해 연말에 사서 10년 보유했을 때의 연평균 수익률(배당 포함). 주황 점은 같은 기간 S&amp;P 500. 막대가 낮게 떨어진 해가 &lsquo;최악의 진입 시점&rsquo;이다.
                </p>
              </div>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">3</span>
              <div>
                <b>아래 &lsquo;인사이트&rsquo;에서 지금 사도 되는지 본다.</b>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  위에서부터 순서대로:
                  <span className="text-amber-600 dark:text-amber-400"> 노란 박스</span>(Claude가 뉴스로 직접 쓴 분석, 추천 종목만) →
                  사업성 평가(회사가 얼마나 좋은가, 주가와 무관) →
                  1. 지금 한눈에(지금 PER이 평소보다 싼가, 이익이 늘고 있나) →
                  2. 이익 시계(적정가 선, 내 몫 이익·잉여현금, 1달러당 이익·현금·ROE·ROIC) →
                  3. 과거(수익이 이익·배당·PER 중 어디서 왔나, 매수 PER별 결과) →
                  4. 앞으로(지금 사면 10년 뒤 예상) → 5. 결론 → 부록(과거 바닥 직후 매수, 접혀 있음).
                </p>
              </div>
            </li>
          </ol>
          <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-blue-200 dark:border-blue-900/60 pt-2 space-y-1">
            <p><b>핵심만 보려면:</b> 노란 박스의 &lsquo;결론&rsquo;과 &lsquo;숫자로 본 결론&rsquo; 두 곳만 읽어도 된다.</p>
            <p><b>숫자 읽는 법:</b> 지금 PER이 10년 중간 PER보다 낮으면 평소보다 싸다. 이익/10년 고점이 85% 미만이면 이익이 꺾인 상태라 PER이 실제보다 비싸 보일 수 있다. 시나리오 표에서 과거 이익 성장률 줄(회색 배경)을 보면 &lsquo;과거 속도라면 몇 %&rsquo;가 바로 보인다.</p>
          </div>
        </section>

        {/* 헤더 */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">위대한 기업</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            매년 연말 매수 후 10년 보유하는 시나리오 · 최근 15가지 진입 시점 기준
          </p>
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">
            ★ 모든 수익률은 배당 재투자 포함 총수익률 (Yahoo Finance 수정주가 기준)
          </p>
        </div>

        {/* 종목 비교 개요 */}
        <OverviewTable activeStock={activeStock} setActiveStock={setActiveStock} />

        {/* 종목 선택 */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">종목 선택</label>
          <select
            value={activeStock}
            onChange={e => setActiveStock(Number(e.target.value))}
            className="flex-1 max-w-xs rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STOCKS.map((s, i) => (
              <option key={s.key} value={i}>
                {s.data.ticker} — {s.data.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-400 dark:text-gray-500">{STOCKS.length}개 종목</span>
        </div>

        {/* 종목명 */}
        <div className="space-y-0.5">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {current.data.name} ({current.data.ticker})
            </h2>
            <span className="text-xs text-gray-400">{current.data.currency} · 벤치마크: {current.data.benchmark}</span>
          </div>
          {(() => {
            const desc = (spDesc as any)[current.data.ticker]
            if (!desc) return null
            return (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                {desc.sector && (
                  <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">{desc.sector}</span>
                )}
                {desc.products && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">{desc.products}</span>
                )}
              </div>
            )
          })()}
        </div>

        {/* 차트 */}
        <RollingChart key={current.key} data={current.data} />

        {/* 롤링 테이블 */}
        <RollingTable data={current.data} />

        {/* 에르메스 전용 인사이트 */}
        {current.key === 'RMS' && <QualityCard stockKey="RMS" />}
        {current.key === 'RMS' && <RmsInsight data={current.data} />}
        {current.key === 'NKE' && <QualityCard stockKey="NKE" />}
        {current.key === 'NKE' && <NkeInsight data={current.data} />}
        {current.key !== 'RMS' && current.key !== 'NKE' && (current.data as any).type !== 'etf' && (
          <AutoInsight key={current.key} stockKey={current.key} data={current.data} />
        )}


      </div>
    </div>
  )
}
