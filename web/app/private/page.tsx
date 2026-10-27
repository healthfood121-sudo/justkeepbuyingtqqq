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

const SORT_LABEL: Record<string, string> = {
  fullCagr: '전체 연평균 수익률', cagrMn: '10년 수익 최소', cagrMed: '10년 수익 중간', cagrMx: '10년 수익 최대',
  diffMn: 'S&P 500 대비 최소', diffMed: 'S&P 500 대비 중간', diffMx: 'S&P 500 대비 최대', roe: 'ROE', roic: 'ROIC', score: '사업성',
  fairGap: '적정가 대비(이익)', fcfGap: '적정가 대비(잉여)', ocfGap: '적정가 대비(영업)', relScore: '신뢰', gradeN: '등급', groupN: '상황',
}
type SortKey = 'fullCagr' | 'cagrMn' | 'cagrMed' | 'cagrMx' | 'diffMn' | 'diffMed' | 'diffMx' | 'roe' | 'roic' | 'score' | 'fairGap' | 'fcfGap' | 'ocfGap' | 'relScore' | 'gradeN' | 'groupN'
type SubKey = 'moat' | 'pricing' | 'profit' | 'growth' | 'durability'
const SUB_LABEL: Record<SubKey, string> = { moat: '경쟁우위', pricing: '가격결정력', profit: '수익성', growth: '성장성', durability: '지속가능성' }
type FairInfo = {
  fairPe: number; eps: number; t: number; price: number; priceDate: string; oneOff?: 'drop' | 'spike'
  fcfMult?: number; fcf?: number; fcfT?: number; fcfOneOff?: 'drop' | 'spike'   // 잉여현금흐름 기준 (적정 P/FCF, 최근 주당 잉여현금)
  ocfMult?: number; ocf?: number; ocfT?: number; ocfOneOff?: 'drop' | 'spike'   // 영업현금흐름 기준
}
// 월말 주가 ÷ 기준값(EPS 또는 주당 잉여현금)의 20년 중간값 — 이익 시계·export_fair_value.py와 같은 규칙
function multMedian(rows: Array<{ t: number; c: number }>, anchors: ClockAnchor[], exclude?: [number, number]): number | null {
  const at = makeEpsAt(anchors, 0), peak = makePeakAt(anchors)
  const tl = anchors[anchors.length - 1][0]
  const v = rows.filter(r => r.t >= anchors[0][0] && r.t >= tl - 20 && r.t <= tl && !(exclude && r.t >= exclude[0] && r.t < exclude[1]))
    .map(r => { const e = at(r.t); return e != null && e > 0 && e >= MEANINGFUL_EPS_RATIO * peak(r.t) && r.c / e < 200 ? r.c / e : null })
    .filter((x): x is number => x != null)
  return v.length >= 24 ? Math.round(quantile(v, 0.5)) : null
}
type QualInfo = { roe: number | null; roic: number | null; epsG10?: number | null; q?: Quality; score: number | null; group: GroupKey | null; fair?: FairInfo; g?: number; rest?: boolean }
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
// 신뢰도: 세 기준(이익·잉여현금·영업현금) 중 경고 없는 값들이 서로 얼마나 비슷한가
type Rel = { level: '높음' | '보통' | '낮음'; score: number; why: string; mid: number | null }
function reliabilityOf(vals: Array<{ k: string; gap: number | null; warn: string | null }>): Rel | null {
  const have = vals.filter(v => v.gap != null)
  if (!have.length) return null
  const clean = have.filter(v => !v.warn)
  const sgn = (x: number) => `${x > 0 ? '+' : ''}${x.toFixed(0)}%`
  const list = have.map(v => `${v.k} ${sgn(v.gap!)}${v.warn ? '(⚠)' : ''}`).join(', ')
  const cg = clean.map(v => v.gap!)
  const spread = cg.length >= 2 ? Math.max(...cg) - Math.min(...cg) : null
  const mid = cg.length ? quantile(cg, 0.5) : null
  const epsClean = clean.some(v => v.k === '이익')
  let level: Rel['level']
  if (clean.length >= 2 && spread! <= 30 && epsClean) level = '높음'
  else if ((clean.length >= 2 && spread! <= 60) || (clean.length === 1 && have.length === 1)) level = '보통'
  else level = '낮음'
  const why = `${list}. ` + (spread != null ? `경고 없는 기준끼리 차이 ${spread.toFixed(0)}%p` : clean.length === 1 ? `경고 없는 기준이 ${clean[0].k} 하나뿐` : '모든 기준에 경고')
    + (mid != null ? ` · 경고 없는 값의 중간 ${sgn(mid)}` : '')
  return { level, score: level === '높음' ? 3 : level === '보통' ? 2 : 1, why, mid }
}
const TIP_REL = <>세 기준(이익·잉여현금·영업현금)의 &lsquo;적정가 대비&rsquo;가 서로 비슷한지로 매긴 믿을 만한 정도. ⚠ 붙은 값은 빼고 본다.
  <br /><b>높음</b>: 이익 포함 경고 없는 기준 2개 이상, 서로 차이 30%p 이하
  <br /><b>보통</b>: 차이 60%p 이하, 또는 기준이 이익 하나뿐(은행·보험)
  <br /><b>낮음</b>: 그 밖(기준끼리 크게 다르거나 대부분 ⚠). 배지에 마우스를 올리면 근거가 나온다.</>

const TIP_FAIR = <><b>이익</b> = 이익(EPS) 기준, <b>잉여</b> = 잉여현금흐름 기준, <b>영업</b> = 영업현금흐름 기준(이익 시계에서 기준 버튼으로 바꾼 값과 같음). <b>신뢰</b> = 세 값이 서로 비슷한 정도. 둘이 비슷하면 믿을 만하고, 크게 다르면 일회성 손익이나 설비투자 급증을 의심한다.
  <br />이익 시계의 &lsquo;적정가 대비&rsquo;와 같은 숫자. 적정가 = 최근 1년 EPS(마지막 실적 이후는 성장률로 늘림) × 적정 PER.
  <br />적정 PER = 지난 20년 월말 PER의 중간값(에르메스는 거품기 2019~2025년을 뺀 중간값).
  <br />성장률 = 개별 분석 판단, 없으면 과거 5·10년 EPS 성장률 중 낮은 값(0~15%).
  <br />마이너스(초록) = 적정가보다 쌈, 플러스(빨강) = 비쌈. 이익이 크게 줄었거나 적자인 종목은 빈칸.
  <br />⚠ 회색 = 숫자를 그대로 믿기 어려운 경우(참고만, 숫자에 마우스를 올리면 이유): 과거 PER 중간값 50배 이상(아마존·테슬라·리츠 등), 또는 최근 1년 EPS가 직전 3년 최고치의 절반 미만·1.8배 초과(일회성 손익 의심).</>

// 마우스를 올리거나(휴대폰은 ? 를 누르면) 설명이 뜨는 작은 도움말
function Tip({ children, text, below = false, right = false }: { children: ReactNode; text: ReactNode; below?: boolean; right?: boolean }) {
  return (
    <span className="relative group/tip inline-flex items-center">
      {children}
      <span tabIndex={0} className="ml-0.5 text-gray-400 cursor-help outline-none">?</span>
      <span className={`absolute ${below ? 'top-full mt-1.5' : 'bottom-full mb-2'} ${right ? 'right-0' : 'left-0'} w-64 max-w-[calc(100vw-2rem)] z-50
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
  <br />지금은 비쌈: PER이 평소보다 30% 넘게 높음
  <br />정렬(↓): 주가만 쉬는 중 → 꾸준·적당 → 지금은 비쌈 → 이익 주춤 → 분류 없음</>

// ── 종목 비교 표 필터 ─────────────────────────────────────────
type FilterSnap = {
  minPeriods: number; minCagrMin: number | ''; minMedian: number; minDiffMin: number | ''; minDiffMedian: number
  maxRange: number | ''; excludeEtf: boolean; minRoe: number | ''; minRoic: number | ''
  gradeF: 'all' | 'A' | 'AB'; minScore: number | ''; subMins: Partial<Record<SubKey, number>>; groupF: 'all' | GroupKey
  maxFairGap: number | ''
  minNeg10: number | ''          // 10년 막대(다 채운 것 + 9년 이상 지난 마지막 막대) 중 마이너스 개수 ≥
  maxLast10: number | ''         // 가장 최근 10년 막대(9년 이상)의 연 수익률 ≤ (%)
  minEpsG10: number | ''         // EPS 10년 연평균 성장률 ≥ (%)
  maxLastPct: number | ''        // 최근 10년 막대가 그 회사 과거 10년 막대 중 하위 N% 이내
  restF: boolean                 // 주가 쉬는 중: 3년 고점 대비 −20% 이하 또는 PER이 10년 중간값의 85% 이하
  relF: 'all' | 'high' | 'mid'   // 적정가 신뢰도: 전체 / 높음만 / 높음·보통
  keys?: string[]                 // 이 종목들만 (Claude 관심 목록 같은 고정 목록)
}
const DEFAULT_F: FilterSnap = {
  minPeriods: 0, minCagrMin: '', minMedian: 0, minDiffMin: '', minDiffMedian: 0, maxRange: '', excludeEtf: false,
  minRoe: '', minRoic: '', gradeF: 'all', minScore: '', subMins: {}, groupF: 'all', maxFairGap: '', relF: 'all', minNeg10: '', maxLast10: '', minEpsG10: '', maxLastPct: '', restF: false,
}
// 저장된 프리셋(예전 형식 포함)을 빠짐없는 필터 값으로 맞춘다. 빠진 값은 '필터 없음'
function normFilter(f: Record<string, any>): FilterSnap {
  const subMins: Partial<Record<SubKey, number>> = { ...(f.subMins ?? {}) }
  if (f.subKey && f.minSub !== '' && f.minSub != null) subMins[f.subKey as SubKey] = Number(f.minSub) // 예전 형식
  const out: any = { ...DEFAULT_F }
  for (const k of Object.keys(DEFAULT_F)) if (k !== 'subMins' && f[k] != null) out[k] = f[k]
  out.subMins = subMins
  out.keys = Array.isArray(f.keys) && f.keys.length ? [...f.keys] : undefined
  return out
}
const sameFilter = (a: FilterSnap, b: FilterSnap) => {
  const sa = Object.entries(a.subMins).filter(([, v]) => v != null).sort(), sb = Object.entries(b.subMins).filter(([, v]) => v != null).sort()
  return (Object.keys(DEFAULT_F) as (keyof FilterSnap)[]).every(k => k === 'subMins' || a[k] === b[k]) && JSON.stringify(sa) === JSON.stringify(sb)
    && JSON.stringify([...(a.keys ?? [])].sort()) === JSON.stringify([...(b.keys ?? [])].sort())
}
type FilterRow = {
  s: any; completedCount: number; cagrMn: number | null; cagrMed: number | null; cagrMx: number | null
  diffMn: number | null; diffMed: number | null; roe: number | null; roic: number | null; score: number | null; q?: Quality; group: GroupKey | null
  fairGap: number | null
  relScore?: number | null
  neg10?: number; last10?: number | null; epsG10?: number | null; lastPct?: number | null; rest?: boolean  // 10년 막대(다 채운 것 + 9년 이상 지난 마지막 막대): 마이너스 개수, 가장 최근 막대 수익률
}
function passesFilter(row: FilterRow, F: FilterSnap): boolean {
  if (F.keys && !F.keys.includes(row.s.key)) return false
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
  if (F.minNeg10 !== '' && (row.neg10 ?? 0) < F.minNeg10) return false
  if (F.maxLast10 !== '' && (row.last10 == null || row.last10 > F.maxLast10)) return false
  if (F.minEpsG10 !== '' && (row.epsG10 == null || row.epsG10 < F.minEpsG10)) return false
  if (F.maxLastPct !== '' && (row.lastPct == null || row.lastPct > F.maxLastPct)) return false
  if (F.restF && !row.rest) return false
  if (F.relF === 'high' && row.relScore !== 3) return false
  if (F.relF === 'mid' && (row.relScore == null || row.relScore < 2)) return false
  return true
}

// 필터 조건을 사람이 읽는 문장으로 (내 프리셋 툴팁·선택한 프리셋 설명)
function describeFilter(F: FilterSnap): string {
  const a: string[] = []
  if (F.keys) a.push(`고정 목록 ${F.keys.length}개(${F.keys.join('·')})`)
  if (F.excludeEtf) a.push('ETF 제외')
  if (F.gradeF === 'A') a.push('A등급')
  if (F.gradeF === 'AB') a.push('A·B등급')
  for (const [k, v] of Object.entries(F.subMins) as [SubKey, number][]) if (v != null) a.push(`${SUB_LABEL[k]} ${v}점 이상`)
  if (F.minScore !== '') a.push(`사업성 ${F.minScore}점 이상`)
  if (F.minRoe !== '') a.push(`ROE ${F.minRoe}% 이상`)
  if (F.minRoic !== '') a.push(`ROIC ${F.minRoic}% 이상`)
  if (F.minPeriods > 0) a.push(`10년 보유 결과 ${F.minPeriods}번 이상`)
  if (F.minCagrMin !== '') a.push(`가장 나쁜 10년도 연 ${F.minCagrMin}% 이상`)
  if (F.minMedian > 0) a.push(`10년 수익 중간값 연 ${F.minMedian}% 이상`)
  if (F.minDiffMin !== '') a.push(`S&P 500 대비 최솟값 ${F.minDiffMin}%p 이상`)
  if (F.minDiffMedian !== 0) a.push(`S&P 500 대비 중간값 ${F.minDiffMedian}%p 이상`)
  if (F.maxRange !== '') a.push(`10년 수익 최고·최저 차이 ${F.maxRange}%p 이하`)
  if (F.groupF !== 'all') a.push(`분류: ${GROUPS[F.groupF].short}`)
  if (F.maxFairGap !== '') a.push(`적정가 대비 ${F.maxFairGap}% 이하`)
  if (F.relF === 'high') a.push('적정가 신뢰도 높음')
  if (F.relF === 'mid') a.push('적정가 신뢰도 보통 이상')
  if (F.minNeg10 !== '') a.push(`마이너스 10년 막대 ${F.minNeg10}개 이상`)
  if (F.maxLast10 !== '') a.push(`최근 10년 막대 연 ${F.maxLast10}% 이하`)
  if (F.minEpsG10 !== '') a.push(`EPS 10년 성장률 ${F.minEpsG10}% 이상`)
  if (F.maxLastPct !== '') a.push(`최근 10년 막대가 과거 막대 중 하위 ${F.maxLastPct}% 이내`)
  if (F.restF) a.push('주가 쉬는 중(3년 고점 −20% 또는 PER 평소보다 낮음)')
  return a.length ? a.join(' · ') : '조건 없음(전체)'
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
  { name: '⑧ Claude 관심 목록', why: '2026-10-24 Claude가 고른 8개. 위대한 기업(④ 최정예)이면서 지금 값이 적정 수준 이하이고 세 기준(이익·잉여현금·영업현금)이 대체로 같은 말을 하는 종목. 싸고 신호 일치: 롤린스·레녹스·코파트·맥도날드·IDEXX·에르메스 / 적정 수준: 마스터카드·인튜이티브서지컬. 투자 권유 아님.',
    f: { keys: ['ROL', 'LII', 'CPRT', 'MCD', 'IDXX', 'RMS', 'MA', 'ISRG'] } },
  { name: '⑨ 역발상 후보', why: '지금 진행 중인 마지막 10년 막대(2016년 매수 → 지금, 9년 이상 지남)가 마이너스 = 10년을 들고 있어도 손해인 종목(예: 나이키). 신타스는 1998~2001년 매수 막대가 연속으로 마이너스였고, 그 구간이 끝날 무렵 산 사람은 큰 수익을 냈다. 다만 회사 자체가 망가져서 마이너스인 경우가 더 많으니 등급·사업의 질·상황을 꼭 같이 본다(등급 필터를 A·B로 걸면 좁혀진다).',
    f: { excludeEtf: true, maxLast10: 0 } },
  { name: '⑩ 역발상(이익 성장 중)', why: '⑨ 중에서 10년 동안 EPS는 늘어난(연 0% 이상) 종목만 = 이익은 자랐는데 주가만 쉰 신타스형. 신타스는 1998~2001년 PER 40~60배에 샀다가 10년 마이너스가 났지만, 그동안 EPS는 매년 늘었고 PER이 11~21배로 내려온 끝 무렵이 큰 매수 기회였다. 지금 PER이 너무 낮으면(한 자릿수) 빚·일회성 이익을 따로 확인.',
    f: { excludeEtf: true, maxLast10: 0, minEpsG10: 0 } },
  { name: '⑪ 해자 그대로 · 주가 쉬는 중', why: '경쟁우위 4점 이상인 A·B등급(해자가 안 무너진 회사) + 주가가 3년 고점보다 20% 넘게 빠졌거나 PER이 평소보다 낮음 + 지금 끝나 가는 10년 막대가 그 회사 과거 10년 막대 중 하위 25%(바닥권). 막대가 평소 수준에서 떨어진 바닥에서 사면 다음 10년 결과가 좋았던 경우가 많았다는 생각에서 출발. 이익이 잠깐 줄어든 회사(유나이티드헬스형)도 포함되니, 이익이 고점의 절반 아래로 떨어진 곳은 일시적인지 따로 확인. 과거 패턴이 반복된다는 보장은 없다.',
    f: { excludeEtf: true, gradeF: 'AB', subMins: { moat: 4 }, restF: true, maxLastPct: 25 } },
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
  // 2·3차 정렬: 전에 1차였던 열들(최근 것부터). 1차 값이 같을 때 차례로 이 열들로 순서를 정한다
  const [sortRest, setSortRest] = useState<Array<{ k: SortKey; d: 'desc' | 'asc' }>>([])
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
          roe: (x as any).roe5 ?? (x as any).roe ?? null, roic: (x as any).roic5 ?? (x as any).roic ?? null, epsG10: x.epsCagr10 ?? null,
          q, score: q ? qualityScore(q) : null, group: classify(x, q, 'moat'),
          fair: fairs[x.key], g: clockGrowth(x.key, x.epsCagr10, x.epsCagr5),
          rest: (x.fromHigh3y != null && x.fromHigh3y <= -20) || (x.peVsMed != null && x.peVsMed <= 0.85),
        }
      }
      // 에르메스: 이익 시계와 같게 — 거품기 뺀 20년 PER 중간값, 4번 '기본' 성장률
      if (rmsPx && m.RMS) {
        const rows = (rmsPx.rows as Array<{ d: string; c: number }>).map(r => { const [y, mo] = r.d.split('-').map(Number); return { t: y + mo / 12, c: r.c } })
        const pe = multMedian(rows, RMS_ANCHORS, [2019, 2026])
        const fcfM = multMedian(rows, RMS_FCF_ANCHORS, [2019, 2026]) ?? multMedian(rows, RMS_FCF_ANCHORS)
        const lastF = RMS_FCF_ANCHORS[RMS_FCF_ANCHORS.length - 1]
        const ocfM = multMedian(rows, RMS_OCF_ANCHORS, [2019, 2026]) ?? multMedian(rows, RMS_OCF_ANCHORS)
        const lastO = RMS_OCF_ANCHORS[RMS_OCF_ANCHORS.length - 1]
        const hi3 = Math.max(...rows.slice(-36).map(r => r.c)), lastC = rmsPx.last.close
        m.RMS = { ...m.RMS, rest: hi3 > 0 && lastC / hi3 - 1 <= -0.2 }
        if (pe != null) m.RMS = { ...m.RMS, g: epsGrowthOf(HERMES_SCENARIOS[0].f), fair: {
          fairPe: pe, eps: RMS_ANCHORS[RMS_ANCHORS.length - 1][1], t: RMS_ANCHORS[RMS_ANCHORS.length - 1][0], price: rmsPx.last.close, priceDate: rmsPx.last.date,
          oneOff: oneOffFlag(RMS_ANCHORS)?.kind,
          ...(fcfM != null ? { fcfMult: fcfM, fcf: lastF[1], fcfT: lastF[0], fcfOneOff: oneOffFlag(RMS_FCF_ANCHORS)?.kind } : {}),
          ...(ocfM != null ? { ocfMult: ocfM, ocf: lastO[1], ocfT: lastO[0], ocfOneOff: oneOffFlag(RMS_OCF_ANCHORS)?.kind } : {}),
        } }
      }
      for (const [k, q] of Object.entries(qs)) if (!m[k]) m[k] = { roe: null, roic: null, q, score: qualityScore(q), group: null }
      setQual(m)
    }).catch(e => console.error('종목 비교 표 자료를 불러오지 못함', e))
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
      if (Array.isArray(f.sortRest)) setSortRest(f.sortRest.filter((x: any) => x?.k).slice(0, 2))
    } catch {}
    try {
      const p = JSON.parse(localStorage.getItem('private_presets') ?? '[]')
      if (Array.isArray(p)) setPresets(p)
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem('private_filters', JSON.stringify({ sortKey, sortDir, sortRest })) } catch {}
  }, [sortKey, sortDir, sortRest])

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
      // 지금 1차를 2차로, 2차를 3차로 내리고 새 열을 1차로(같은 열이 겹치면 빼고, 최대 3단계)
      setSortRest(r => [{ k: sortKey, d: sortDir }, ...r.filter(x => x.k !== key && x.k !== sortKey)].slice(0, 2))
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function colBg(col: SortKey) {
    return sortKey === col ? 'bg-blue-50 dark:bg-blue-900/25' : ''
  }

  function SortIcon({ col }: { col: SortKey }) {
    const ri = sortKey !== col ? sortRest.findIndex(x => x.k === col) : -1
    if (ri >= 0) return <span className="ml-0.5 text-blue-400 text-[10px]">{sortRest[ri].d === 'desc' ? '↓' : '↑'}{ri + 2}</span>
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
    // 10년 막대: 다 채운 것 + 거의 다 채운(9년 이상) 지금 진행 중인 마지막 막대
    const bars10 = s.data.rows10y.filter((r: any) => r.cagr != null && (r.isComplete || (r.yearsActual ?? 0) >= 9))
    const neg10 = bars10.filter((r: any) => r.cagr < 0).length
    const last10 = bars10.length ? bars10[bars10.length - 1].cagr as number : null
    // 최근 막대가 그 회사 '다 채운' 10년 막대들 중 아래에서 몇 %인가(낮을수록 바닥권). 8개 이상일 때만
    const fullC = s.data.rows10y.filter((r: any) => r.isComplete && r.cagr != null).map((r: any) => r.cagr as number)
    const lastPct = last10 != null && fullC.length >= 8 ? Math.round(100 * fullC.filter((c: number) => c < last10).length / fullC.length) : null
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
    const fi = qi?.fair
    const fcfGap = fi?.fcfMult != null && fi.fcf != null && fi.fcfT != null && qi?.g != null
      ? fairGapOf({ ...fi, fairPe: fi.fcfMult, eps: fi.fcf, t: fi.fcfT }, qi.g, tNowYr) : null
    const fcfWarn: string | null = fcfGap == null ? null
      : fi!.fcfMult! >= HIGH_PE_WARN ? '과거 주가/잉여현금 배수 중간값이 50배 이상 — 현금 기준 적정가가 부풀려질 수 있음. 참고만'
      : fi!.fcfOneOff === 'drop' ? '최근 1년 잉여현금흐름이 직전 3년 최고치의 절반 미만 — 설비투자 급증이나 일회성 지출 가능성(비쌈이 과장될 수 있음). 참고만'
      : fi!.fcfOneOff === 'spike' ? '최근 1년 잉여현금흐름이 직전 3년 최고치의 1.8배 초과 — 일회성 유입 가능성(쌈이 과장될 수 있음). 참고만'
      : null
    const ocfGap = fi?.ocfMult != null && fi.ocf != null && fi.ocfT != null && qi?.g != null
      ? fairGapOf({ ...fi, fairPe: fi.ocfMult, eps: fi.ocf, t: fi.ocfT }, qi.g, tNowYr) : null
    const ocfWarn: string | null = ocfGap == null ? null
      : fi!.ocfMult! >= HIGH_PE_WARN ? '과거 주가/영업현금 배수 중간값이 50배 이상 — 참고만'
      : fi!.ocfOneOff === 'drop' ? '최근 1년 영업현금흐름이 직전 3년 최고치의 절반 미만 — 일회성 지출 가능성. 참고만'
      : fi!.ocfOneOff === 'spike' ? '최근 1년 영업현금흐름이 직전 3년 최고치의 1.8배 초과 — 일회성 유입 가능성. 참고만'
      : null
    const fairWarn: string | null = !qi?.fair ? null
      : qi.fair.fairPe >= HIGH_PE_WARN ? '과거 PER 중간값이 50배 이상이라 이익 기준 적정가가 부풀려질 수 있음(재투자 기업·리츠 등). 참고만'
      : qi.fair.oneOff === 'drop' ? '최근 1년 EPS가 직전 3년 최고치의 절반 미만 — 일회성 비용이 섞였을 가능성(비쌈이 과장될 수 있음). 참고만'
      : qi.fair.oneOff === 'spike' ? '최근 1년 EPS가 직전 3년 최고치의 1.8배 초과 — 일회성 이익이나 호황이 섞였을 가능성(쌈이 과장될 수 있음). 참고만'
      : null
    const rel = reliabilityOf([
      { k: '이익', gap: fairGap, warn: fairWarn }, { k: '잉여현금', gap: fcfGap, warn: fcfWarn }, { k: '영업현금', gap: ocfGap, warn: ocfWarn },
    ])
    return { fairWarn, i, s, fullCagr, cagrMn, cagrMed, cagrMx, diffMn, diffMed, diffMx, completedCount, neg10, last10, lastPct, rest: !!qi?.rest, epsG10: qi?.epsG10 ?? null, roe, roic, score, q: qi?.q, group: qi?.group ?? null, fairGap, fcfGap, fcfWarn, ocfGap, ocfWarn, rel, relScore: rel?.score ?? null,
      // 정렬용: 등급 A>B>C>D, 상황 주가만 쉬는 중>꾸준·적당>지금은 비쌈>이익 주춤
      gradeN: qi?.q ? ({ A: 4, B: 3, C: 2, D: 1 } as const)[qi.q.grade] : null,
      groupN: qi?.group ? ({ pause: 4, steady: 3, pricey: 2, stumble: 1 } as const)[qi.group] : null }
  }).sort((a, b) => {
    const cmp = (k: SortKey, d: 'desc' | 'asc') => {
      const va = a[k], vb = b[k]
      if (va == null || vb == null) return va == null && vb == null ? 0 : va == null ? 1 : -1 // 빈 값은 방향과 상관없이 맨 아래
      return d === 'desc' ? vb - va : va - vb
    }
    let c = cmp(sortKey, sortDir)
    for (const x of sortRest) { if (c) break; if (x.k !== sortKey) c = cmp(x.k, x.d) }
    return c
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
                <span className="hidden md:block absolute top-full left-0 mt-1.5 w-64 z-50 invisible opacity-0 group-hover/bp:visible group-hover/bp:opacity-100
                                 transition-opacity duration-150 pointer-events-none bg-gray-900 text-white text-xs rounded-md px-2.5 py-2 shadow-lg leading-relaxed">
                  {bp.why}
                </span>
              </span>
            )
          })}
        </div>
        {(() => {
          // 지금 켜진 프리셋 설명 — 휴대폰처럼 마우스를 못 올리는 화면에서도 보이게
          const b = builtinNorm.find(bp => sameFilter(bp.nf, F))
          const u = !b ? presets.find(p => sameFilter(normFilter(p.f as Record<string, any>), F)) : undefined
          if (!b && !u) return null
          return (
            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300 bg-blue-50/60 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/40 rounded-lg px-3 py-2 mb-2">
              <b className="text-blue-700 dark:text-blue-300">{b ? b.name : u!.name}</b> — {b ? b.why : describeFilter(normFilter(u!.f as Record<string, any>))}
              {b && <span className="block mt-1 text-gray-400 dark:text-gray-500">조건: {describeFilter(b.nf)}</span>}
            </p>
          )
        })()}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs text-gray-400 dark:text-gray-600 shrink-0">내 프리셋:</span>
          {presets.map(p => (
            <span key={p.name} className="relative group/up inline-flex">
            <span
              className={`inline-flex items-center gap-1 text-xs border rounded-full px-2.5 py-1 cursor-pointer transition-colors ${sameFilter(normFilter(p.f as Record<string, any>), F)
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 text-gray-600 dark:text-gray-400'}`}>
              <span onClick={() => applyPreset(p.f)}>{p.name}</span>
              <button onClick={() => deletePreset(p.name)}
                className="ml-0.5 text-gray-400 dark:text-gray-500 hover:text-red-400 dark:hover:text-red-500 transition-colors leading-none">
                ×
              </button>
            </span>
            <span className="hidden md:block absolute top-full left-0 mt-1.5 w-64 z-50 invisible opacity-0 group-hover/up:visible group-hover/up:opacity-100
                             transition-opacity duration-150 pointer-events-none bg-gray-900 text-white text-xs rounded-md px-2.5 py-2 shadow-lg leading-relaxed">
              {describeFilter(normFilter(p.f as Record<string, any>))}
            </span>
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
              <Tip text={<>10년 보유 막대 중 연 수익률이 마이너스인 막대 수. 10년을 다 채운 막대 + 지금 거의 다 채운(9년 이상 지난) 마지막 막대를 센다. 10년을 들고도 손해였던 구간이 있었던 기업. 역발상 후보: 신타스는 1998~2001년 매수 막대 4개가 마이너스였고, 그 뒤 큰 수익이 났다.</>}>10년 마이너스 막대 ≥</Tip>
              <input type="number" min={0} max={30} value={F.minNeg10} placeholder="—"
                onChange={e => set('minNeg10', e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} />
              개
            </label>
            <label className={labelCls}>
              <Tip text={<>가장 최근 10년 막대(지금 끝나 가는, 9년 이상 지난 막대 — 보통 2016년 매수)의 연 수익률이 이 값 이하인 종목만. 예: 0 → 지금 10년 들고 있어도 손해인 종목, 5 → 10년 동안 연 5%도 못 번 종목.</>}>최근 10년 막대 ≤</Tip>
              <input type="number" min={-100} max={100} value={F.maxLast10} placeholder="—"
                onChange={e => set('maxLast10', e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} />
              %
            </label>
            <label className={labelCls}>
              <Tip text={<>10년 전부터 최근 1년까지 주당순이익(EPS)이 연평균 몇 % 늘었나. 0 이상이면 이익은 늘었는데 주가만 쉰 회사(신타스형), 마이너스면 이익 자체가 줄어든 회사.</>}>EPS 10년 성장률 ≥</Tip>
              <input type="number" min={-50} max={100} value={F.minEpsG10} placeholder="—"
                onChange={e => set('minEpsG10', e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} />
              %
            </label>
            <label className={labelCls}>
              <Tip text={<>지금 끝나 가는 10년 막대(9년 이상 지난 것)가 그 회사의 과거 10년 막대(다 채운 것, 8개 이상) 중 아래에서 몇 % 안에 드는가. 25 → 과거 막대 4개 중 1개보다도 낮은 바닥권. 그 회사 기준이라, 넷플릭스처럼 지금 막대가 연 18%여도 과거(중간값 39%)보다 낮으면 걸린다.</>}>10년 막대 바닥권 ≤ 하위</Tip>
              <input type="number" min={0} max={100} value={F.maxLastPct} placeholder="—"
                onChange={e => set('maxLastPct', e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} />
              %
            </label>
            <label className={`${labelCls} cursor-pointer`}>
              <input type="checkbox" checked={F.restF} onChange={e => set('restF', e.target.checked)} />
              <Tip text={<>주가가 3년 고점보다 20% 넘게 빠졌거나, PER이 10년 중간값의 85% 이하인 종목만.</>}>주가 쉬는 중</Tip>
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
            <span className={labelCls}>
              <Tip text={TIP_REL}>신뢰</Tip>
              {([['all', '전체'], ['high', '높음'], ['mid', '높음·보통']] as const).map(([k, l]) => (
                <button key={k} type="button" onClick={() => set('relF', k)}
                  className={`px-1.5 rounded ${F.relF === k ? 'bg-blue-500 text-white' : 'hover:text-gray-700 dark:hover:text-gray-200'}`}>{l}</button>
              ))}
            </span>
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

      {/* 정렬 상태: 마지막에 누른 열 = 1차, 그 전 열 = 2차 */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
        정렬: <b className="text-gray-600 dark:text-gray-300">{SORT_LABEL[sortKey]} {sortDir === 'desc' ? '높은 순' : '낮은 순'}</b>
        {sortRest.filter(x => x.k !== sortKey).map((x, i) => <span key={x.k}>, {i === 0 ? '같으면' : '그래도 같으면'} <b className="text-gray-600 dark:text-gray-300">{SORT_LABEL[x.k]} {x.d === 'desc' ? '높은 순' : '낮은 순'}</b></span>)}
        {sortRest.length > 0 && <button type="button" onClick={() => setSortRest([])} className="ml-1.5 underline hover:text-gray-600 dark:hover:text-gray-300">2·3차 끄기</button>}
        <span className="ml-2 opacity-80">· 열을 차례로 누르면 마지막에 누른 열이 1차, 그 전이 2차, 그 전전이 3차(같은 열을 다시 누르면 방향만 바뀜)</span>
      </p>
      {/* 넓은 화면에서는 스크롤 상자를 끈다(종목·제목 말풍선이 잘리지 않게). 좁은 화면에서만 옆으로 밀기 */}
      <div className="overflow-x-auto md:overflow-visible">
      <table className="text-[13px]">
        <thead>
          <tr className="text-xs text-gray-400 dark:text-gray-500">
            <th rowSpan={2} className="pb-1 pr-1 w-6" />
            <th className="text-left pb-1 pr-2" rowSpan={2}>종목</th>
            <th colSpan={4} className="text-center pb-1 px-1 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold whitespace-nowrap">
              <Tip text={TIP_FAIR} below>적정가 대비</Tip>
            </th>
            <th colSpan={3} className="text-center pb-1 px-2 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold">
              절대 수익률 <span className="font-normal opacity-60">(%)</span>
            </th>
            <th colSpan={3} className="text-center pb-1 px-2 border-b border-l-2 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold">
              S&P 500 대비 <span className="font-normal opacity-60">(%p)</span>
            </th>
            <th colSpan={4} className="text-center pb-1 px-2 border-b border-l-2 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold">
              사업의 질
            </th>
          </tr>
          <tr className="text-xs text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-gray-700">
            <SortTh col="fairGap" className="text-right py-1 pr-1 font-medium">이익</SortTh>
            <SortTh col="fcfGap" className="text-right py-1 pr-1 font-medium">잉여</SortTh>
            <SortTh col="ocfGap" className="text-right py-1 pr-1 font-medium">영업</SortTh>
            <SortTh col="relScore" className="text-center py-1 pr-2 font-medium"><Tip text={TIP_REL} below>신뢰</Tip></SortTh>
            <SortTh col="cagrMn"  className="text-right py-1 pr-2 font-medium">최소</SortTh>
            <SortTh col="cagrMed" className="text-right py-1 pr-2 font-medium">중간</SortTh>
            <SortTh col="cagrMx"  className="text-right py-1 pr-2 font-medium">최대</SortTh>
            <SortTh col="diffMn"  className="text-right py-1 px-2 font-medium border-l-2 border-gray-200 dark:border-gray-700">최소</SortTh>
            <SortTh col="diffMed" className="text-right py-1 pr-2 font-medium">중간</SortTh>
            <SortTh col="diffMx"  className="text-right py-1 pr-2 font-medium">최대</SortTh>
            <SortTh col="gradeN" className="text-center py-1 px-2 font-medium border-l-2 border-gray-200 dark:border-gray-700"><Tip text={TIP_GRADE} below>등급</Tip></SortTh>
            <SortTh col="score" className="text-right py-1 pr-2 font-medium"><Tip text={TIP_SCORE} below>사업성</Tip></SortTh>
            <SortTh col="roic" className="text-right py-1 pr-2 font-medium"><Tip text={TIP_ROIC} below right>ROIC</Tip></SortTh>
            <SortTh col="groupN" className="text-left py-1 font-medium"><Tip text={TIP_GROUP} below right>상황</Tip></SortTh>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.length === 0 && (
            <tr>
              <td colSpan={16} className="py-8 text-center text-sm text-gray-400 dark:text-gray-600">
                조건에 맞는 종목이 없습니다
              </td>
            </tr>
          )}
          {rows.map(({ i, s, cagrMn, cagrMed, cagrMx, diffMn, diffMed, diffMx, roic, score, q, group, fairGap, fairWarn, fcfGap, fcfWarn, ocfGap, ocfWarn, rel }) => {
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
                  <div className="group/name relative inline-flex items-baseline gap-1 max-w-[96px]">
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
                <td className={`py-1.5 pr-1 text-right text-xs tabular-nums whitespace-nowrap font-semibold ${fairGap == null ? 'text-gray-300 dark:text-gray-600' : fairGap < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'} ${colBg('fairGap')}`}>
                  {fairGap != null ? (fairWarn
                    ? <span className="text-gray-400 dark:text-gray-500 font-normal" title={fairWarn}>⚠{fairGap > 0 ? '+' : ''}{fairGap.toFixed(0)}%</span>
                    : `${fairGap > 0 ? '+' : ''}${fairGap.toFixed(0)}%`) : '—'}
                </td>
                <td className={`py-1.5 pr-1 text-right text-xs tabular-nums whitespace-nowrap ${fcfGap == null ? 'text-gray-300 dark:text-gray-600' : fcfGap < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'} ${colBg('fcfGap')}`}>
                  {fcfGap != null ? (fcfWarn
                    ? <span className="text-gray-400 dark:text-gray-500" title={fcfWarn}>⚠{fcfGap > 0 ? '+' : ''}{fcfGap.toFixed(0)}%</span>
                    : `${fcfGap > 0 ? '+' : ''}${fcfGap.toFixed(0)}%`) : '—'}
                </td>
                <td className={`py-1.5 pr-1 text-right text-xs tabular-nums whitespace-nowrap ${ocfGap == null ? 'text-gray-300 dark:text-gray-600' : ocfGap < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'} ${colBg('ocfGap')}`}>
                  {ocfGap != null ? (ocfWarn
                    ? <span className="text-gray-400 dark:text-gray-500" title={ocfWarn}>⚠{ocfGap > 0 ? '+' : ''}{ocfGap.toFixed(0)}%</span>
                    : `${ocfGap > 0 ? '+' : ''}${ocfGap.toFixed(0)}%`) : '—'}
                </td>
                <td className={`py-1.5 pr-2 text-center ${colBg('relScore')}`}>
                  {rel ? <span title={rel.why} className={`text-[11px] px-1.5 py-0.5 rounded whitespace-nowrap ${rel.level === '높음' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : rel.level === '보통' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300'}`}>{rel.level}</span> : <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>}
                </td>
                {/* 절대 수익률 */}
                <td className={`py-1.5 pr-2 text-right tabular-nums ${cagrMn != null ? cagrTextColor(cagrMn, true) : 'text-gray-300 dark:text-gray-600'} ${colBg('cagrMn')}`}>
                  {cagrMn != null ? cagrMn.toFixed(1) : '진행 중'}
                </td>
                <td className={`py-1.5 pr-2 text-right tabular-nums font-semibold ${cagrMed != null ? cagrTextColor(cagrMed, true) : 'text-gray-300 dark:text-gray-600'} ${colBg('cagrMed')}`}>
                  {cagrMed != null ? cagrMed.toFixed(1) : '진행 중'}
                </td>
                <td className={`py-1.5 pr-2 text-right tabular-nums ${cagrMx != null ? cagrTextColor(cagrMx, true) : 'text-gray-300 dark:text-gray-600'} ${colBg('cagrMx')}`}>
                  {cagrMx != null ? cagrMx.toFixed(1) : '진행 중'}
                </td>
                {/* S&P500 초과수익 */}
                <td className={`py-1.5 px-2 text-right tabular-nums border-l-2 border-gray-200 dark:border-gray-700 ${diffMn != null ? diffColor(diffMn) : 'text-gray-300'} ${colBg('diffMn')}`}>
                  {diffMn != null ? `${diffMn > 0 ? '+' : ''}${diffMn.toFixed(1)}` : '—'}
                </td>
                <td className={`py-1.5 pr-2 text-right tabular-nums font-semibold ${diffMed != null ? diffColor(diffMed) : 'text-gray-300'} ${colBg('diffMed')}`}>
                  {diffMed != null ? `${diffMed > 0 ? '+' : ''}${diffMed.toFixed(1)}` : '—'}
                </td>
                <td className={`py-1.5 pr-2 text-right tabular-nums ${diffMx != null ? diffColor(diffMx) : 'text-gray-300'} ${colBg('diffMx')}`}>
                  {diffMx != null ? `${diffMx > 0 ? '+' : ''}${diffMx.toFixed(1)}` : '—'}
                </td>
                {/* 사업의 질 */}
                <td className="py-1.5 px-2 text-center border-l-2 border-gray-200 dark:border-gray-700">
                  {q ? <span className={`text-[11px] px-1.5 py-0.5 rounded ${gradeColor(q.grade)}`}>{q.grade}</span> : <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>}
                </td>
                <td className={`py-1.5 pr-2 text-right tabular-nums ${score == null ? 'text-gray-300 dark:text-gray-600' : score >= 20 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-700 dark:text-gray-200'} ${colBg('score')}`}>
                  {score != null ? score : '—'}
                </td>
                <td className={`py-1.5 pr-2 text-right tabular-nums ${roic == null ? 'text-gray-300 dark:text-gray-600' : roic >= 20 ? 'text-emerald-600 dark:text-emerald-400' : roic < 8 ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'} ${colBg('roic')}`}>
                  {roic != null ? `${roic.toFixed(0)}%` : '—'}
                </td>
                <td className="py-1.5 whitespace-nowrap">
                  {group ? <span title={GROUPS[group].label} className={`text-[11px] px-1.5 py-0.5 rounded ${groupColor(group)}`}>{({ pause: '쉬는 중', stumble: '이익 주춤', steady: '꾸준', pricey: '비쌈' } as Record<GroupKey, string>)[group]}</span> : <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>}
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

// 이익이 의미 있는 시점인가: 흑자이고, 그때까지의 연간 EPS 최고치의 20% 이상
// (아마존·애플 초기처럼 이익이 0 근처면 PER·적정가가 성립하지 않아 그 구간은 선을 끊고 PER 계산에서도 뺀다)
const MEANINGFUL_EPS_RATIO = 0.2
// 과거 PER 중간값이 이 이상이면 이익 기준 적정가가 부풀려질 수 있어 경고 (아마존·테슬라·리츠 등)
const HIGH_PE_WARN = 50
function makePeakAt(anchors: ClockAnchor[]) {
  return (t: number) => { let m = -Infinity; for (const [ta, e] of anchors) { if (ta > t + 1e-9) break; if (e > m) m = e } return m }
}
// 3년 평균 이익: 각 기준점에서 지난 3년 안의 EPS 평균 (한 해 급락·적자에 덜 흔들리게)
function smoothAnchors(anchors: ClockAnchor[]): ClockAnchor[] {
  return anchors.map(([t]) => {
    const win = anchors.filter(([ta]) => ta <= t + 1e-9 && ta > t - 3 + 0.05)
    return [t, win.reduce((x, [, e]) => x + e, 0) / win.length] as ClockAnchor
  })
}

// 일회성 손익 의심: 최근 1년 EPS가 직전 3.5년 안 연간 EPS 최고치의 절반 미만(일회성 비용) 또는 1.8배 초과(일회성 이익·호황)
// scripts/export_fair_value.py 의 one_off() 와 같은 규칙
function oneOffFlag(anchors: ClockAnchor[]): { kind: 'drop' | 'spike'; ratio: number } | null {
  if (anchors.length < 3) return null
  const [tl, el] = anchors[anchors.length - 1]
  const prev = anchors.slice(0, -1).filter(([t]) => t >= tl - 3.5).map(([, e]) => e)
  if (!prev.length) return null
  const mx = Math.max(...prev)
  if (mx <= 0) return null
  if (el < 0.5 * mx) return { kind: 'drop', ratio: el / mx }
  if (el > 1.8 * mx) return { kind: 'spike', ratio: el / mx }
  return null
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
  fcfAnchors?: ClockAnchor[]                   // 주당 잉여현금흐름 기준점(있으면 '잉여현금흐름 기준' 버튼이 생김)
  ocfAnchors?: ClockAnchor[]                   // 주당 영업현금흐름 기준점
  extraLive?: (now: number, fairNow: number) => ReactNode
  liveTiles?: (now: number) => LiveTile[]       // 째깍째깍 칸에 덧붙일 종목별 타일 (예: 가방·신발 시계)
  segments?: SegClock                          // 사업부별 시계 (애플·구글)
  notes: string
  peExclude?: { from: number; to: number; label: string } // 이 기간을 뺀 PER 중간값도 눈금으로 (예: 거품기)
  fcfPs?: number | null                        // 최근 1년 주당 잉여현금흐름 (있으면 '내 몫 잉여현금' 표시)
}

// 초마다 바뀌는 숫자만 따로 다시 그림 (그래프는 그대로)
type LiveTile = { label: string; value: string; tip: ReactNode; rate?: { perSec: number; what: string; unit: string } } // rate: 내 몫 칸에 '내 주식 몫으로 팔린 개수'를 보여 주는 데 씀

function ClockLive({ cur, epsAt, profitAt, fairPe, shares, sharesOut, extraLive, liveTiles, segments, fcfPs, dps, sharesInput }: {
  cur: string; epsAt: (t: number) => number | null; fairPe: number; shares: number; sharesOut: number | null
  profitAt?: (t: number) => number | null      // 내 몫 이익(회계 EPS). 없으면 epsAt
  extraLive?: (now: number, fairNow: number) => ReactNode
  liveTiles?: (now: number) => LiveTile[]
  segments?: SegClock
  fcfPs?: number | null; dps?: number | null
  sharesInput?: ReactNode                      // 보유 주식 수 입력칸 (내 몫 칸 안에 보여 줌)
}) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 100); return () => clearInterval(id) }, [])
  const fairNow = (epsAt(decYear(now)) ?? 0) * fairPe
  const epsNow = (profitAt ?? epsAt)(decYear(now)) ?? 0
  const startOfYear = new Date(new Date(now).getFullYear(), 0, 1).getTime()
  const startOfDay = new Date(new Date(now).setHours(0, 0, 0, 0)).getTime()
  const money = (v: number, d = 0) => `${v < 0 ? '−' : ''}${cur}${Math.abs(v).toLocaleString('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d })}`
  const tile = 'rounded bg-white/70 dark:bg-gray-900/60 px-3 py-2.5'
  const lab = 'text-[11px] text-gray-500 dark:text-gray-400'
  const big = 'text-sm font-semibold tabular-nums text-gray-900 dark:text-white'
  const co = sharesOut ? epsNow * sharesOut : null
  return (
    <>
      {(co != null || liveTiles) && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">회사 전체 — 1초에 얼마를 벌고, 무엇을 얼마나 파나</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {co != null && <div className={tile}><p className={lab}>회사가 1초에 버는 순이익</p><p className={big}>{money(co / SEC_Y, 0)}</p></div>}
            {co != null && <div className={tile}><p className={lab}>올해 1월 1일부터 번 순이익</p><p className={big}>{money(co * (now - startOfYear) / 1000 / SEC_Y, 0)}</p></div>}
            {liveTiles?.(now).map(x => (
              <div key={x.label} className={tile}><p className={lab}><Tip text={x.tip}>{x.label}</Tip></p><p className={big}>{x.value}</p></div>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-1.5 rounded border border-blue-200 dark:border-blue-900/60 p-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">내 몫 — 내 주식 {shares.toLocaleString()}주가 버는 돈</p>
          {sharesInput}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className={tile}><p className={lab}>적정가 (1주, 계속 오름)</p><p className={big}>{money(fairNow, 4)}</p></div>
          {shares !== 1 && <div className={tile}><p className={lab}>내 주식의 적정 가치</p><p className={big}>{money(fairNow * shares, 2)}</p></div>}
          <div className={tile}><p className={lab}>내 몫 이익: 1초</p><p className={big}>{money(epsNow * shares / SEC_Y, 7)}</p></div>
          <div className={tile}><p className={lab}>내 몫 이익: 오늘 0시부터</p><p className={big}>{money(epsNow * shares * (now - startOfDay) / 1000 / SEC_Y, 5)}</p></div>
          <div className={tile}><p className={lab}>내 몫 이익: 1년</p><p className={big}>{money(epsNow * shares, 2)}</p></div>
          {fcfPs != null && <div className={tile}><p className={lab}>내 몫 잉여현금: 1초</p><p className={big}>{money(fcfPs * shares / SEC_Y, 7)}</p></div>}
          {fcfPs != null && <div className={tile}><p className={lab}>내 몫 잉여현금: 1년</p><p className={big}>{money(fcfPs * shares, 2)}</p></div>}
          {dps != null && dps > 0 && <div className={tile}><p className={lab}>실제로 받는 배당: 1년</p><p className={big}>{money(dps * shares, 2)}</p></div>}
          {sharesOut && !segments ? liveTiles?.(now).filter(x => x.rate).map(x => {
            const r = x.rate!
            const perYear = r.perSec * SEC_Y * shares / sharesOut
            const fmtN = (v: number) => v >= 100 ? Math.round(v).toLocaleString('ko-KR') : v >= 1 ? v.toFixed(1) : v >= 0.01 ? v.toFixed(3) : v.toPrecision(2)
            return (
              <div key={'mine-' + x.label} className={tile}>
                <p className={lab}><Tip text={<>회사 전체 {r.what}({r.unit}) 숫자 × 내 주식 비율({shares.toLocaleString()} ÷ {Math.round(sharesOut / 1e6).toLocaleString()}백만 주). 내가 이 사업의 그만큼을 가진 주인이라고 보면, 1년 동안 내 몫으로 팔리는 양이다. {x.label.includes('값') ? '매출을 대표 상품 가격으로 나눈 값이라 실제 판매 개수와는 다르다.' : ''}</>}>내 몫 {r.what}: 1년</Tip></p>
                <p className={big}>{fmtN(perYear)}{r.unit}{perYear < 1 && perYear > 0 ? <span className="text-xs font-normal text-gray-500"> (약 {perYear > 0.0001 ? Math.round(1 / perYear).toLocaleString() : '많은'}년에 1{r.unit})</span> : null}</p>
              </div>
            )
          }) : null}
        </div>
        {fcfPs != null && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            이익 = 회계상 순이익. 잉여현금 = 사업에서 들어온 현금 − 설비투자로, 주인이 실제로 꺼내 쓸 수 있는 돈에 가깝다(최근 1년 값 고정).
            배당은 그중 회사가 실제로 나눠 준 돈이고, 나머지는 자사주 매입·현금 보유·인수에 쓰인다.
          </p>
        )}
      </div>
      {segments && sharesOut ? <SegmentPanel seg={segments} now={now} shares={shares} sharesOut={sharesOut} /> : null}
      {extraLive?.(now, fairNow)}
    </>
  )
}

// 적자라 이익 시계를 못 그릴 때도 판매 시계 타일은 보여 줌
function SalesLive({ liveTiles, seg, sharesOut }: { liveTiles?: (now: number) => LiveTile[]; seg?: SegClock; sharesOut?: number | null }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 100); return () => clearInterval(id) }, [])
  return (
    <>
    {liveTiles && <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3 space-y-2">
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">째깍째깍 — 초 단위로 보는 판매</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {liveTiles(now).map(x => (
          <div key={x.label} className="rounded bg-white/70 dark:bg-gray-900/60 px-3 py-2.5">
            <p className="text-[11px] text-gray-500 dark:text-gray-400"><Tip text={x.tip}>{x.label}</Tip></p>
            <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">{x.value}</p>
          </div>
        ))}
      </div>
    </div>}
    {seg && sharesOut ? <SegmentPanel seg={seg} now={now} shares={1} sharesOut={sharesOut} /> : null}
    </>
  )
}

// ── 사업부별 시계: 회사 발표 분기 숫자를 사업부별로 나눠 1초 매출·이익과 내 몫을 보여 줌 (애플·구글) ──
type SegRow = { name: string; rev: number; profit: number; note: string; color: string
  units?: { n: number; unit: string; what: string; value?: boolean } } // n = 그 기간 판매량(value면 매출 ÷ 대표 가격 = '몇 개 값')
type SegClock = {
  period: string; days: number; src: string
  cur?: string                      // 기본 $
  profitLabel: string               // 예: '순이익(추정)'
  rows: SegRow[]                    // rev·profit = 그 분기 금액(달러)
  facts: { label: string; value: string; note: string }[]   // 1회당 숫자 등
  how: string                       // 이익을 사업부별로 나눈 방법
  products?: { title: string; note: string; rows: SegRow[] } // 이익은 없고 매출만 있는 두 번째 나눔 (예: 나이키 제품별)
}
// 사업별 비중만 적어 두면, SEC 자동 수집 숫자(최근 분기 매출·최근 1년 순이익)로 사업부별 시계를 만든다.
// r = 매출 비중(%), p = 순이익 배분 비중(%, 생략 시 r). u = [대표 가격($), 단위, 무엇] — 매출 ÷ 가격 환산.
type SegMixRow = { n: string; r: number; p?: number; c: string; note: string; u?: [number, string, string] }
type SegMix = { basis: string; rows: SegMixRow[]; fact?: { label: string; value: string; note: string }; how?: string }

function segFromMix(mix: SegMix, f: ClockFund): SegClock | undefined {
  const q = f.cash?.revQ
  const ni = f.cash?.ttm?.ni ?? (f.cash?.years ? Object.entries(f.cash.years).sort((a, b) => +b[0] - +a[0])[0]?.[1]?.ni : null)
  if (!q?.rev || ni == null) return undefined
  const s = new Date(q.start + 'T00:00:00Z'), e = new Date(q.end + 'T00:00:00Z')
  const days = Math.max(1, Math.round((+e - +s) / 864e5) + 1)
  const rev = q.rev * 1e6, prof = ni * 1e6 * days / 365
  const ym = (d: Date) => [d.getUTCFullYear(), d.getUTCMonth() + 1]
  const [y1, m1] = ym(s), [y2, m2] = ym(e)
  const period = y1 === y2 ? `${y2}년 ${m1}~${m2}월` : `${y1}년 ${m1}월~${y2}년 ${m2}월`
  // p는 그 회사 최근 1년 순이익 부호 기준 비중(합 100). 적자 회사는 흑자 사업에 음수를 적어 손실 사업이 적자를 떠안게 한다
  const sumR = mix.rows.reduce((a, r) => a + r.r, 0) || 1, sumP0 = mix.rows.reduce((a, r) => a + (r.p ?? r.r), 0)
  const usePR = Math.abs(sumP0) < 1e-9, sumP = usePR ? sumR : sumP0
  const usd = (v: number) => v >= 1e8 ? `${(v / 1e8).toFixed(v >= 1e10 ? 0 : 1)}억 달러` : `${Math.round(v / 1e6)}백만 달러`
  const g = q.prev ? (q.rev / q.prev - 1) * 100 : null
  return {
    period: `${period}(${days}일)`, days, src: 'SEC 제출 자료 자동 수집', profitLabel: '순이익(추정)',
    rows: mix.rows.map(r => {
      const rv = rev * r.r / sumR
      return { name: r.n, rev: rv, profit: prof * (usePR ? r.r : r.p ?? r.r) / sumP, color: r.c, note: r.note,
        units: r.u ? { n: rv / r.u[0], unit: r.u[1], what: `${r.u[2]}(약 $${r.u[0].toLocaleString('en-US')})`, value: true } : undefined }
    }),
    facts: [
      { label: '분기 매출', value: `${usd(rev)}${g != null ? `(${g >= 0 ? '+' : ''}${g.toFixed(1)}%)` : ''}`, note: `${q.start} ~ ${q.end}. 괄호는 1년 전 같은 분기 대비.` },
      mix.fact ?? { label: '최근 1년 순이익', value: usd(ni * 1e6), note: `이 분기 순이익은 1년 치를 날짜 수(${days}일)만큼 나눈 값으로 잡았다.` },
    ],
    how: `${ni < 0 && mix.rows.some(r => (r.p ?? r.r) < 0) ? '최근 1년 장부상 적자라, 손실을 내는 사업에 적자를 몰아 배분했다(추정). ' : ''}${ni < 0 && mix.rows.every(r => (r.p ?? r.r) >= 0) ? '최근 1년 장부상 적자라(일회성 손상 처리·인수 비용 등이 섞여 있을 수 있음) 사업별 이익도 마이너스로 나온다. 실제 사업이 모두 적자라는 뜻은 아니다. ' : ''}회사 전체 분기 매출과 최근 1년 순이익은 SEC 제출 자료에서 자동으로 가져온 실제 숫자다(새 실적이 나오면 저절로 바뀜). 사업별 매출 비중은 ${mix.basis} 기준이고, 순이익은 사업별 이익률 차이를 반영한 비중으로 나눴다(추정).${mix.how ? ' ' + mix.how : ''}${mix.rows.some(r => r.u) ? ' 판매 개수는 매출을 대표 가격으로 나눈 환산값.' : ''}`,
  }
}

const SEG_MIX: Record<string, SegMix> = {
  FTNT: { basis: '2025년 사업 보고서', rows: [
    { n: '보안 장비(방화벽)', r: 30, p: 25, c: 'bg-red-600', note: '회사 네트워크 입구에 다는 방화벽 장비(포티게이트). 자체 칩을 써서 싸고 빠르다.' },
    { n: '보안 구독·유지보수', r: 70, p: 75, c: 'bg-blue-700', note: '방화벽에 새 위협 정보를 계속 받는 구독, 클라우드 보안. 매년 반복되는 매출.' },
  ] },
  IBKR: { basis: '2025년 사업 보고서', rows: [
    { n: '고객 예탁금·신용 대출 이자', r: 65, p: 68, c: 'bg-blue-700', note: '고객이 맡긴 현금과 신용 대출에서 버는 이자.' },
    { n: '거래 수수료', r: 30, p: 28, c: 'bg-emerald-500', note: '주식·옵션·선물 거래 수수료. 세계 고객 약 400만 계좌.' },
    { n: '기타', r: 5, p: 4, c: 'bg-gray-400', note: '시세 데이터 등.' },
  ], how: '거의 모든 업무가 자동화돼 세전 이익률이 70% 안팎이다.' },
  A: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '생명과학·분석 장비', r: 50, p: 48, c: 'bg-blue-600', note: '액체·가스 크로마토그래피, 질량 분석기. 제약·화학 품질 검사.' },
    { n: '정비·소모품(애질런트 크로스랩)', r: 38, p: 40, c: 'bg-emerald-500', note: '설치된 장비의 정비 계약·소모품. 안정적인 반복 매출.' },
    { n: '진단·유전자 분석', r: 12, p: 12, c: 'bg-violet-500', note: '병리 진단 시약, 유전자 치료제 원료(올리고).' },
  ] },
  SCHW: { basis: '2025년 사업 보고서', rows: [
    { n: '예금 이자', r: 50, p: 55, c: 'bg-blue-700', note: '고객 계좌의 현금을 은행 예금으로 받아 채권에 굴린 이자.' },
    { n: '펀드·자문 수수료', r: 27, p: 25, c: 'bg-emerald-500', note: '자체 ETF·자문 계좌 수수료.' },
    { n: '거래 수수료', r: 18, p: 15, c: 'bg-amber-500', note: '주식은 무료지만 옵션·선물·주문 흐름 대가로 받는 돈.' },
    { n: '기타', r: 5, p: 5, c: 'bg-gray-400', note: '은행 카드 수수료 등.' },
  ], how: '증권사지만 이익의 절반 이상이 고객 현금에서 나오는 이자라 금리에 민감하다.' },
  // ── ② 오래 증명된 기업 · ③ · ⑦ ──
  TDG: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '동력·제어 부품', r: 54, p: 57, c: 'bg-blue-700', note: '항공기 펌프·밸브·모터·점화 장치. 대부분 그 부품을 만드는 회사가 TDG 하나라 값을 올려도 바꾸기 어렵다.' },
    { n: '기체 부품', r: 43, p: 41, c: 'bg-sky-500', note: '조종석 안전띠·화물칸 장치·조명·잠금장치 등.' },
    { n: '비항공 부품', r: 3, p: 2, c: 'bg-gray-400', note: '산업용 부품.' },
  ], how: '부품 교체 수요(애프터마켓)가 매출의 절반 이상이고 이익은 그보다 더 크다. 이자 비용이 커서 순이익은 영업이익보다 훨씬 작다.' },
  TDY: { basis: '2025년 사업 보고서', rows: [
    { n: '디지털 영상(적외선 카메라·센서)', r: 56, p: 55, c: 'bg-violet-600', note: '플리어 열화상 카메라, 우주망원경·위성용 이미지 센서, 의료 엑스선 검출기.' },
    { n: '계측 장비', r: 24, p: 30, c: 'bg-emerald-500', note: '해양 탐사 장비, 가스 분석기, 오실로스코프.' },
    { n: '항공·방산 전자', r: 13, p: 12, c: 'bg-blue-700', note: '항공기·미사일용 전자 부품.' },
    { n: '설계·제작 시스템', r: 7, p: 3, c: 'bg-gray-400', note: '미국 정부 위탁 공학 서비스.' },
  ] },
  RMD: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '수면 무호흡 기기', r: 52, p: 50, c: 'bg-blue-600', u: [900, '대', '에어센스 양압기'], note: '잘 때 코로 공기를 불어 넣어 숨 막힘을 막는 양압기.' },
    { n: '마스크·소모품', r: 39, p: 46, c: 'bg-sky-400', u: [180, '개', '양압기 마스크'], note: '몇 달마다 바꿔야 하는 마스크·호스·필터. 이익률이 가장 높다.' },
    { n: '요양원 소프트웨어', r: 9, p: 4, c: 'bg-gray-400', note: '재택 요양·간병 기관용 소프트웨어(매각 추진 중).' },
  ] },
  FIX: { basis: '2025년 사업 보고서', rows: [
    { n: '냉난방·배관 공사', r: 75, p: 80, c: 'bg-blue-600', note: '데이터센터·반도체 공장·병원의 대형 냉난방·배관 설치. 수주 잔고가 분기 매출의 4배를 넘는다.' },
    { n: '전기 공사', r: 25, p: 20, c: 'bg-amber-500', note: '같은 건물의 전기 배선·설비 공사.' },
  ] },
  WST: { basis: '2025년 사업 보고서', rows: [
    { n: '주사약 용기 부품(자체 제품)', r: 82, p: 90, c: 'bg-blue-600', u: [0.2, '개', '고무마개·주사기 부품'], note: '약병 고무마개, 주사기 피스톤 등. 비만약(GLP-1)·항체 의약품 증가 수혜. 한번 승인받은 부품은 잘 바뀌지 않는다.' },
    { n: '위탁 생산', r: 18, p: 10, c: 'bg-gray-400', note: '제약사 대신 주사 기구·진단 기기를 조립.' },
  ] },
  AMP: { basis: '2025년 사업 보고서', rows: [
    { n: '자산관리(재무설계사)', r: 70, p: 70, c: 'bg-blue-700', note: '재무설계사 약 1만 명이 고객 자산을 관리하고 수수료를 받는다.' },
    { n: '펀드 운용(콜럼비아 쓰레드니들)', r: 20, p: 14, c: 'bg-emerald-500', note: '뮤추얼펀드·연기금 운용.' },
    { n: '연금·보험', r: 10, p: 16, c: 'bg-amber-500', note: '변액연금·생명보험.' },
  ] },
  PKG: { basis: '2025년 사업 보고서', rows: [
    { n: '골판지 상자', r: 90, p: 95, c: 'bg-amber-700', u: [1.5, '개', '골판지 상자'], note: '택배·식품·공산품 포장 상자. 원지부터 상자까지 직접 만든다.' },
    { n: '종이(인쇄·복사용)', r: 10, p: 5, c: 'bg-gray-400', note: '복사용지 등 백상지.' },
  ] },
  AON: { basis: '2025년 사업 보고서', rows: [
    { n: '기업 보험 중개', r: 44, p: 45, c: 'bg-red-700', note: '기업이 보험을 살 때 조건을 찾아 주고 수수료를 받는다.' },
    { n: '재보험 중개', r: 17, p: 22, c: 'bg-blue-600', note: '보험사가 드는 보험을 중개.' },
    { n: '직원 복지·건강 컨설팅', r: 15, p: 13, c: 'bg-emerald-500', note: '회사 단체 건강보험 설계.' },
    { n: '퇴직연금·인사 컨설팅', r: 24, p: 20, c: 'bg-amber-500', note: '퇴직연금 운용 자문, 임금 체계 컨설팅(NFP 포함).' },
  ] },
  DPZ: { basis: '2025년 사업 보고서', rows: [
    { n: '가맹점 재료 공급', r: 60, p: 25, c: 'bg-gray-500', note: '미국 가맹점에 도우·치즈를 만들어 배달. 매출은 크지만 거의 남기지 않는다.' },
    { n: '미국 가맹 로열티·광고비', r: 15, p: 40, c: 'bg-blue-700', u: [15, '판', '피자 한 판'], note: '가맹점 매출의 약 5.5%를 로열티로 받는다. 비용이 거의 없다.' },
    { n: '직영 매장', r: 10, p: 7, c: 'bg-red-600', note: '미국 직영 약 300개.' },
    { n: '해외 로열티', r: 6, p: 28, c: 'bg-emerald-500', note: '90여 나라 가맹 본부가 내는 로열티.' },
    { n: '기타(광고 기금 등)', r: 9, p: 0, c: 'bg-gray-300', note: '가맹점이 낸 광고비를 받아 그대로 쓰는 돈.' },
  ] },
  AME: { basis: '2025년 사업 보고서', rows: [
    { n: '전자 계측 기기', r: 63, p: 70, c: 'bg-blue-600', note: '분석 장비·전력 측정기·의료 기기 부품. 틈새시장 1위 제품을 사 모은다.' },
    { n: '전기 기계 부품', r: 37, p: 30, c: 'bg-gray-500', note: '정밀 모터·특수 금속·항공기 정비 부품.' },
  ] },
  NEE: { basis: '2025년 사업 보고서', rows: [
    { n: '플로리다 전력(FPL)', r: 70, p: 60, c: 'bg-blue-600', u: [150, '달', '가정 한 달 전기 요금'], note: '플로리다 약 600만 가구에 전기 공급. 요금을 정부가 정해 안정적.' },
    { n: '풍력·태양광 발전(넥스트에라 에너지 리소스)', r: 30, p: 40, c: 'bg-emerald-500', note: '세계 최대 풍력·태양광 발전 회사. 발전한 전기를 장기 계약으로 판다.' },
  ] },
  COR: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '미국 의약품 도매', r: 90, p: 75, c: 'bg-blue-600', note: '제약사에서 약을 사서 약국·병원에 배달. 매출 대비 남는 돈이 1%도 안 된다.' },
    { n: '해외·동물 의약품 등', r: 10, p: 25, c: 'bg-emerald-500', note: '해외 도매, 동물 약 유통(MWI), 임상시험 지원.' },
  ] },
  DRI: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '올리브가든', r: 42, p: 47, c: 'bg-green-600', u: [22, '접시', '파스타 한 접시'], note: '이탈리안 패밀리 레스토랑 약 930개.' },
    { n: '롱혼 스테이크하우스', r: 25, p: 27, c: 'bg-red-700', u: [30, '접시', '스테이크 한 접시'], note: '스테이크 전문점 약 590개.' },
    { n: '파인 다이닝(루스크리스 등)', r: 11, p: 9, c: 'bg-gray-700', note: '고급 스테이크하우스.' },
    { n: '기타(체다스·야드하우스 등)', r: 22, p: 17, c: 'bg-amber-500', note: '여러 중저가 브랜드.' },
  ] },
  ROST: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '로스 드레스 포 레스', r: 87, p: 92, c: 'bg-blue-600', u: [12, '개', '할인 옷 한 벌'], note: '백화점 재고를 싸게 사서 20~60% 싸게 파는 할인 매장 약 1,900개.' },
    { n: 'dd\'s 디스카운츠', r: 13, p: 8, c: 'bg-pink-500', note: '더 저렴한 가격대 할인 매장 약 360개.' },
  ] },
  DOV: { basis: '2025년 사업 보고서', rows: [
    { n: '공학 부품', r: 19, p: 16, c: 'bg-gray-500', note: '자동차 정비 리프트, 폐기물 수거 차량 장비.' },
    { n: '청정 에너지·연료 장비', r: 22, p: 19, c: 'bg-emerald-500', note: '주유기, 수소·LNG 충전 부품.' },
    { n: '유체 이송 펌프', r: 24, p: 28, c: 'bg-blue-600', note: '제약·바이오 공장용 펌프·커넥터.' },
    { n: '냉장·식품 설비', r: 18, p: 13, c: 'bg-sky-400', note: '마트 냉장 진열대, 열교환기.' },
    { n: '컴프레서·이송 장비', r: 17, p: 24, c: 'bg-amber-500', note: '가스 압축기 부품, 산업용 밸브.' },
  ] },
  RJF: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '개인 자산관리', r: 70, p: 60, c: 'bg-blue-700', note: '재무설계사 약 8,800명이 고객 자산을 관리.' },
    { n: '투자은행·증권', r: 12, p: 5, c: 'bg-gray-500', note: '기업 인수합병 자문, 채권 중개.' },
    { n: '은행', r: 15, p: 28, c: 'bg-emerald-500', note: '레이먼드제임스 은행 대출·예금.' },
    { n: '펀드 운용', r: 3, p: 7, c: 'bg-amber-500', note: '자회사 펀드 운용.' },
  ] },
  CSX: { basis: '2025년 사업 보고서', rows: [
    { n: '공산품(화학·자동차·금속 등)', r: 64, p: 66, c: 'bg-blue-700', note: '미국 동부 화물 철도. 화학제품·자동차·목재·곡물.' },
    { n: '석탄', r: 15, p: 16, c: 'bg-gray-700', note: '발전소·수출용 석탄.' },
    { n: '컨테이너', r: 14, p: 10, c: 'bg-sky-500', note: '항구에서 내륙으로 가는 컨테이너.' },
    { n: '기타', r: 7, p: 8, c: 'bg-gray-400', note: '화물칸 보관료 등.' },
  ] },
  CASY: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '기름', r: 62, p: 35, c: 'bg-gray-600', u: [3, '갤런', '휘발유 1갤런'], note: '미국 중서부 소도시 주유소 약 2,900개. 1갤런당 약 40센트 남긴다.' },
    { n: '편의점 물건', r: 25, p: 33, c: 'bg-blue-600', note: '음료·과자·담배 등.' },
    { n: '피자·즉석식품', r: 10, p: 30, c: 'bg-red-600', u: [15, '판', '케이시스 피자 한 판'], note: '미국 5위 피자 체인급. 이익률이 가장 높다.' },
    { n: '기타', r: 3, p: 2, c: 'bg-gray-300', note: '세차·복권 등.' },
  ] },
  NDSN: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '산업용 정밀 도포', r: 50, p: 52, c: 'bg-blue-600', note: '접착제·코팅을 정밀하게 뿌리는 장비(기저귀·포장·가전 공장).' },
    { n: '의료·유체 부품', r: 30, p: 30, c: 'bg-emerald-500', note: '의료 기기용 튜브·커넥터.' },
    { n: '전자 공정 장비', r: 20, p: 18, c: 'bg-violet-500', note: '반도체·전자 부품 검사·도포 장비.' },
  ] },
  CRM: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '영업 관리(세일즈 클라우드)', r: 22, c: 'bg-sky-600', note: '영업 사원의 고객·계약 관리 소프트웨어. 세계 1위.' },
    { n: '고객 상담(서비스 클라우드)', r: 24, c: 'bg-blue-600', note: '콜센터·고객 문의 관리.' },
    { n: '데이터 분석·연동(태블로·뮬소프트·데이터)', r: 22, c: 'bg-violet-500', note: '데이터 시각화, 시스템 연결, AI 에이전트(에이전트포스).' },
    { n: '마케팅·쇼핑몰', r: 14, c: 'bg-amber-500', note: '이메일 마케팅, 온라인 쇼핑몰 구축.' },
    { n: '슬랙·기타', r: 12, c: 'bg-emerald-500', note: '업무용 메신저 슬랙 등.' },
    { n: '컨설팅·교육', r: 6, p: 0, c: 'bg-gray-400', note: '도입 컨설팅. 거의 남지 않는다.' },
  ] },
  STE: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '병원 멸균·수술실 장비', r: 58, p: 55, c: 'bg-blue-600', note: '수술 도구 멸균기, 수술대, 소모품.' },
    { n: '멸균 위탁 서비스', r: 27, p: 35, c: 'bg-emerald-500', note: '의료 기기 회사 제품을 방사선으로 멸균해 주는 서비스.' },
    { n: '제약 공장 소모품', r: 15, p: 10, c: 'bg-gray-500', note: '제약 공장 세정제·멸균 장비.' },
  ] },
  TSCO: { basis: '2025년 사업 보고서', rows: [
    { n: '사료·반려동물 용품', r: 50, p: 45, c: 'bg-amber-600', u: [25, '포대', '가축 사료 한 포대'], note: '시골 주민용 가축 사료, 개·고양이 사료. 자주 사러 와서 안정적.' },
    { n: '농장 용품·공구', r: 30, p: 33, c: 'bg-green-600', note: '울타리·공구·작업복.' },
    { n: '계절 상품·잔디 정원', r: 20, p: 22, c: 'bg-sky-500', note: '난방기·정원 용품.' },
  ] },
  YUM: { basis: '2025년 사업 보고서', rows: [
    { n: 'KFC', r: 45, p: 51, c: 'bg-red-600', note: '전 세계 약 3만 2천 개 매장. 대부분 가맹점이라 로열티를 받는다.' },
    { n: '타코벨', r: 35, p: 37, c: 'bg-violet-600', note: '미국 중심 약 8,800개.' },
    { n: '피자헛', r: 13, p: 10, c: 'bg-red-800', note: '약 2만 개. 성장이 멈춘 상태.' },
    { n: '해비트 버거 등', r: 7, p: 2, c: 'bg-gray-400', note: '햄버거 체인 해비트 그릴.' },
  ] },
  HUBB: { basis: '2025년 사업 보고서', rows: [
    { n: '전력망 장비', r: 62, p: 66, c: 'bg-blue-700', note: '전신주 부품·변전 설비·전력 계량기. 전력망 교체 투자 수혜.' },
    { n: '건물 전기 부품', r: 38, p: 34, c: 'bg-amber-500', note: '콘센트·배선 장치·데이터센터 전기 부품.' },
  ] },
  WRB: { basis: '2025년 사업 보고서', rows: [
    { n: '기업 손해보험', r: 82, p: 75, c: 'bg-blue-700', note: '중소기업 배상책임·근로자 산재·전문직 보험 등 60여 개 전문 보험 브랜드.' },
    { n: '재보험·해외', r: 13, p: 12, c: 'bg-emerald-500', note: '보험사를 위한 보험.' },
    { n: '투자 수익', r: 5, p: 13, c: 'bg-amber-500', note: '받은 보험료를 채권에 굴려 버는 돈.' },
  ] },
  WSM: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '포터리반', r: 39, p: 38, c: 'bg-amber-700', note: '가구·인테리어 소품.' },
    { n: '웨스트엘름', r: 24, p: 22, c: 'bg-gray-600', note: '모던 가구.' },
    { n: '윌리엄스소노마', r: 18, p: 18, c: 'bg-emerald-600', note: '고급 주방용품.' },
    { n: '포터리반 키즈·틴', r: 13, p: 15, c: 'bg-sky-400', note: '아이·청소년 가구.' },
    { n: '기타', r: 6, p: 7, c: 'bg-gray-400', note: '로잉·마크앤그레이엄 등.' },
  ], how: '매출의 약 3분의 2가 온라인.' },
  UNH: { basis: '2025년 사업 보고서', rows: [
    { n: '건강보험(유나이티드헬스케어)', r: 74, p: 45, c: 'bg-blue-700', note: '미국 최대 건강보험. 직장 보험·노인 보험(메디케어). 의료비가 늘어 이익이 크게 줄었다.' },
    { n: '병원·의사(옵텀 헬스)', r: 12, p: 25, c: 'bg-emerald-500', note: '직접 운영하는 병원·의원 네트워크.' },
    { n: '약제비 관리(옵텀 Rx)', r: 12, p: 18, c: 'bg-amber-500', note: '보험사 대신 약값을 협상·처리하는 회사.' },
    { n: '의료 데이터·소프트웨어(옵텀 인사이트)', r: 2, p: 12, c: 'bg-violet-500', note: '병원 청구 처리 소프트웨어.' },
  ], how: '사업 간 내부 거래를 빼서 매출 비중을 잡았다.' },
  EME: { basis: '2025년 사업 보고서', rows: [
    { n: '미국 전기 공사', r: 30, p: 32, c: 'bg-amber-500', note: '데이터센터·반도체 공장 전기 설비 공사.' },
    { n: '미국 냉난방·배관 공사', r: 42, p: 46, c: 'bg-blue-600', note: '대형 건물 기계 설비.' },
    { n: '건물 유지보수', r: 21, p: 15, c: 'bg-gray-500', note: '완공된 건물의 설비 관리.' },
    { n: '산업 설비 정비·영국', r: 7, p: 7, c: 'bg-emerald-500', note: '정유 공장 정비, 영국 건물 관리.' },
  ] },
  CSGP: { basis: '2025년 사업 보고서', rows: [
    { n: '상업용 부동산 데이터(코스타)', r: 37, p: 80, c: 'bg-blue-700', note: '사무실·상가 임대·매매 데이터 구독. 거의 독점이라 이익의 대부분.' },
    { n: '아파트 임대 광고(아파트먼츠닷컴)', r: 33, p: 40, c: 'bg-emerald-500', note: '아파트 주인이 내는 광고비.' },
    { n: '주택 매매 사이트(홈스닷컴)', r: 10, p: -40, c: 'bg-red-500', note: '질로우와 경쟁하려 광고비를 크게 써서 손실.' },
    { n: '기타(상가 매물·해외 등)', r: 20, p: 20, c: 'bg-gray-400', note: '루프넷 상가 매물 광고 등.' },
  ] },
  DXCM: { basis: '2025년 사업 보고서', rows: [
    { n: '연속 혈당 측정기(미국)', r: 72, c: 'bg-emerald-600', u: [200, '개', '혈당 측정 센서(10~15일용)'], note: '팔에 붙이면 혈당을 5분마다 휴대폰에 보내는 센서.' },
    { n: '연속 혈당 측정기(해외)', r: 28, c: 'bg-sky-500', note: '유럽 등.' },
  ] },
  EW: { basis: '2025년 사업 보고서', rows: [
    { n: '경피적 대동맥 판막(TAVR)', r: 70, p: 74, c: 'bg-red-600', u: [30000, '개', '사피엔 인공 판막'], note: '가슴을 열지 않고 혈관으로 넣는 인공 심장 판막. 세계 1위.' },
    { n: '승모·삼첨판 시술', r: 15, p: 8, c: 'bg-pink-500', note: '새 성장 사업. 아직 투자 단계.' },
    { n: '외과 수술용 판막', r: 15, p: 18, c: 'bg-gray-500', note: '가슴을 여는 수술용 판막.' },
  ] },
  NVR: { basis: '2025년 사업 보고서', rows: [
    { n: '주택 건설·판매', r: 97, p: 92, c: 'bg-amber-700', u: [460000, '채', '새 집 한 채'], note: '미국 동부 새 집. 땅을 직접 사지 않고 옵션만 걸어 위험을 줄인다.' },
    { n: '주택담보대출', r: 3, p: 8, c: 'bg-emerald-500', note: '집 산 사람에게 대출을 내주고 은행에 판다.' },
  ] },
  NSC: { basis: '2025년 사업 보고서', rows: [
    { n: '공산품(화학·금속·자동차 등)', r: 63, p: 65, c: 'bg-blue-700', note: '미국 동부 화물 철도. 유니언퍼시픽과 합병 추진.' },
    { n: '컨테이너', r: 25, p: 22, c: 'bg-sky-500', note: '항구 컨테이너.' },
    { n: '석탄', r: 12, p: 13, c: 'bg-gray-700', note: '발전·수출용 석탄.' },
  ] },
  ACGL: { basis: '2025년 사업 보고서', rows: [
    { n: '손해보험', r: 50, p: 40, c: 'bg-blue-700', note: '기업 배상책임·전문직·재산 보험.' },
    { n: '재보험', r: 37, p: 35, c: 'bg-emerald-500', note: '보험사가 드는 보험. 자연재해가 많으면 손실.' },
    { n: '주택담보대출 보험', r: 5, p: 15, c: 'bg-amber-500', note: '집값 대비 대출이 많은 사람이 드는 보험. 이익률이 높다.' },
    { n: '투자 수익', r: 8, p: 10, c: 'bg-gray-400', note: '보험료를 굴려 버는 이자.' },
  ] },
  NDAQ: { basis: '2025년 사업 보고서', rows: [
    { n: '금융 소프트웨어', r: 40, p: 32, c: 'bg-violet-600', note: '은행 자금세탁 감시(베리패스), 거래소 시스템, 위험 관리(아덴자).' },
    { n: '지수·데이터·상장', r: 37, p: 45, c: 'bg-blue-700', note: '나스닥100 지수 사용료(QQQ 등), 상장 수수료, 시세 데이터.' },
    { n: '주식·옵션 거래', r: 23, p: 23, c: 'bg-emerald-500', note: '거래 수수료(중개 리베이트 뺀 값).' },
  ] },
  ACN: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '컨설팅', r: 49, p: 47, c: 'bg-violet-600', note: '디지털 전환·AI 도입 전략, 시스템 구축.' },
    { n: '운영 대행(아웃소싱)', r: 51, p: 53, c: 'bg-blue-600', note: '기업 IT·인사·회계 업무를 장기 계약으로 대신 처리.' },
  ] },
  LMT: { basis: '2025년 사업 보고서', rows: [
    { n: '전투기(F-35 등)', r: 40, p: 38, c: 'bg-gray-700', note: 'F-35 전투기 생산·정비.' },
    { n: '미사일·화력 통제', r: 20, p: 25, c: 'bg-red-600', note: '패트리어트·재블린·하이마스 미사일.' },
    { n: '헬기·전투 체계', r: 23, p: 20, c: 'bg-blue-600', note: '블랙호크 헬기, 이지스 함정 시스템.' },
    { n: '우주', r: 17, p: 17, c: 'bg-violet-500', note: '위성·미사일 방어·오리온 우주선.' },
  ] },
  ERIE: { basis: '2025년 사업 보고서', rows: [
    { n: '보험 관리 수수료', r: 100, c: 'bg-blue-700', note: '보험 가입자 모임(이리 보험 교환소)의 영업·관리를 대신 하고 보험료의 약 25%를 수수료로 받는다. 보험금 손실을 지지 않아 위험이 작다.' },
  ] },
  TRV: { basis: '2025년 사업 보고서', rows: [
    { n: '기업 보험', r: 46, p: 50, c: 'bg-red-700', note: '중소·중견 기업 재산·배상책임·산재 보험.' },
    { n: '임원·보증 보험', r: 16, p: 25, c: 'bg-blue-600', note: '임원 배상책임, 공사 이행 보증. 이익률이 높다.' },
    { n: '개인 보험(자동차·주택)', r: 38, p: 25, c: 'bg-amber-500', note: '자동차·주택 보험. 자연재해에 민감.' },
  ] },
  WAT: { basis: '2025년 사업 보고서', rows: [
    { n: '액체 크로마토그래피·질량 분석(워터스)', r: 87, p: 90, c: 'bg-blue-600', note: '약 성분을 분리·측정하는 분석 장비와 소모품(컬럼). 제약사 품질 검사 필수.' },
    { n: '열 분석(TA 인스트루먼트)', r: 13, p: 10, c: 'bg-gray-500', note: '재료가 열에 어떻게 변하는지 재는 장비.' },
  ], how: 'BD의 생명과학·진단 사업 합병 이후 비중은 바뀔 수 있다.' },
  IT: { basis: '2025년 사업 보고서', rows: [
    { n: '연구 구독(가트너 리서치)', r: 82, p: 92, c: 'bg-blue-700', note: '기업 IT 담당자가 구독하는 시장 조사·자문. 이익의 대부분.' },
    { n: '콘퍼런스', r: 9, p: 6, c: 'bg-amber-500', note: 'IT 임원 행사.' },
    { n: '컨설팅', r: 9, p: 2, c: 'bg-gray-400', note: 'IT 비용 절감 컨설팅.' },
  ] },
  CMI: { basis: '2025년 사업 보고서', rows: [
    { n: '엔진', r: 30, p: 28, c: 'bg-red-700', note: '트럭·버스·건설 장비용 디젤·가스 엔진.' },
    { n: '부품', r: 34, p: 30, c: 'bg-gray-500', note: '배기가스 정화·필터·터보차저.' },
    { n: '발전기(데이터센터 비상 전원)', r: 18, p: 26, c: 'bg-emerald-500', note: '데이터센터 비상 발전기. AI 투자로 급성장.' },
    { n: '변속기·차축(동력 전달)', r: 14, p: 16, c: 'bg-blue-600', note: '트럭 변속기·브레이크.' },
    { n: '수소·전기(액셀레라)', r: 4, p: 0, c: 'bg-sky-400', note: '전기·수소 동력. 손실 사업(정리 중).' },
  ] },
  MCK: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '미국 의약품 도매', r: 88, p: 60, c: 'bg-blue-600', note: '약국·병원에 약 배달. 매출은 크지만 1%도 안 남는다.' },
    { n: '전문 의약품·암 진료 지원', r: 7, p: 15, c: 'bg-red-500', note: '항암제 유통, 암 병원 네트워크.' },
    { n: '처방 기술 서비스', r: 2, p: 20, c: 'bg-violet-500', note: '보험 사전 승인·약값 지원 프로그램 소프트웨어. 이익률이 높다.' },
    { n: '의료 소모품', r: 3, p: 5, c: 'bg-gray-400', note: '의원용 소모품 유통.' },
  ] },
  IEX: { basis: '2025년 사업 보고서', rows: [
    { n: '유체·계량 장비', r: 37, p: 36, c: 'bg-blue-600', note: '펌프·유량계·수질 측정 장비.' },
    { n: '의료·과학 부품', r: 42, p: 44, c: 'bg-emerald-500', note: '분석 장비용 정밀 밸브·광학 부품.' },
    { n: '소방·안전 장비', r: 21, p: 20, c: 'bg-red-600', note: '소방차 펌프, 구조 장비(죠스 오브 라이프).' },
  ] },
  JKHY: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '은행 핵심 시스템', r: 45, p: 45, c: 'bg-blue-700', note: '중소 은행·신협의 계좌·대출 관리 시스템. 한번 쓰면 거의 바꾸지 않는다.' },
    { n: '결제 처리', r: 38, p: 38, c: 'bg-emerald-500', note: '카드·송금 처리 수수료.' },
    { n: '보완 서비스', r: 17, p: 17, c: 'bg-gray-400', note: '인터넷 뱅킹 등.' },
  ] },
  JBHT: { basis: '2025년 사업 보고서', rows: [
    { n: '철도 연계 컨테이너 운송', r: 49, p: 60, c: 'bg-blue-700', note: '트럭이 컨테이너를 기차역까지 나르고 기차로 장거리 운송.' },
    { n: '전용 트럭 운송', r: 28, p: 30, c: 'bg-amber-500', note: '특정 고객 전용 트럭·기사 계약.' },
    { n: '최종 배송·기타', r: 23, p: 10, c: 'bg-gray-400', note: '가구 배송, 운송 중개.' },
  ] },
  HON: { basis: '2025년 사업 보고서', rows: [
    { n: '항공(엔진·조종석 장비)', r: 40, p: 45, c: 'bg-blue-700', note: '항공기 보조 엔진·항법 장비. 분사 예정.' },
    { n: '빌딩 자동화', r: 18, p: 20, c: 'bg-emerald-500', note: '빌딩 화재 감지·출입 통제·냉난방 제어.' },
    { n: '산업 자동화', r: 25, p: 20, c: 'bg-gray-500', note: '공장 제어 시스템, 바코드 스캐너.' },
    { n: '에너지·소재', r: 17, p: 15, c: 'bg-amber-500', note: '정유 기술 라이선스, 냉매. 분사 진행 중.' },
  ] },
  SNA: { basis: '2025년 사업 보고서', rows: [
    { n: '정비공 공구(밴 영업)', r: 40, p: 38, c: 'bg-red-600', u: [100, '개', '스냅온 렌치 세트'], note: '트럭(밴)이 정비소를 돌며 공구를 판다. 할부도 해 준다.' },
    { n: '산업·군용 공구', r: 26, p: 22, c: 'bg-gray-500', note: '공장·항공 정비 공구.' },
    { n: '진단 장비·소프트웨어', r: 25, p: 27, c: 'bg-blue-600', note: '자동차 고장 진단기, 정비 정보 소프트웨어.' },
    { n: '공구 할부 금융', r: 9, p: 13, c: 'bg-emerald-500', note: '정비공에게 공구 값을 할부로 빌려주는 이자.' },
  ] },
  ROP: { basis: '2025년 사업 보고서', rows: [
    { n: '업무용 소프트웨어(종류별)', r: 58, p: 60, c: 'bg-violet-600', note: '보험·법률·건설·대학 등 틈새 업종 전용 소프트웨어.' },
    { n: '네트워크 소프트웨어', r: 24, p: 30, c: 'bg-blue-600', note: '화물 운송 중개 네트워크(DAT), 식품 유통 주문.' },
    { n: '기술 제품', r: 18, p: 10, c: 'bg-gray-500', note: '수도 계량기·의료 기기 부품.' },
  ] },
  MLM: { basis: '2025년 사업 보고서', rows: [
    { n: '골재(돌·모래·자갈)', r: 75, p: 85, c: 'bg-gray-600', u: [20, '톤', '골재 1톤'], note: '도로·건물용 돌. 무거워 멀리 못 옮기니 채석장 근처 지역 독점.' },
    { n: '시멘트·레미콘·아스팔트', r: 20, p: 10, c: 'bg-gray-400', note: '텍사스 레미콘 등(일부 매각).' },
    { n: '마그네시아 특수 제품', r: 5, p: 5, c: 'bg-amber-500', note: '산업용 화학 원료.' },
  ] },
  ALGN: { basis: '2025년 사업 보고서', rows: [
    { n: '투명 교정 장치(인비절라인)', r: 81, p: 90, c: 'bg-sky-500', u: [1300, '건', '인비절라인 교정 1건(치과 납품가)'], note: '철사 대신 투명 플라스틱 틀로 치아를 교정.' },
    { n: '구강 스캐너·소프트웨어', r: 19, p: 10, c: 'bg-gray-500', note: '치아 3D 스캐너(아이테로).' },
  ] },
  PCAR: { basis: '2025년 사업 보고서', rows: [
    { n: '대형 트럭(켄워스·피터빌트·DAF)', r: 75, p: 55, c: 'bg-red-700', u: [180000, '대', '대형 트럭'], note: '장거리 화물 트럭.' },
    { n: '트럭 부품', r: 20, p: 33, c: 'bg-gray-500', note: '판매한 트럭의 교체 부품. 이익률이 높고 안정적.' },
    { n: '트럭 할부 금융', r: 5, p: 12, c: 'bg-emerald-500', note: '트럭 구입 대출·리스.' },
  ] },
  WAB: { basis: '2025년 사업 보고서', rows: [
    { n: '화물 기관차·부품', r: 72, p: 75, c: 'bg-blue-700', note: '기관차 생산, 기관차 정비·개조·부품, 철도 신호 소프트웨어.' },
    { n: '지하철·여객열차 부품', r: 28, p: 25, c: 'bg-gray-500', note: '전동차 브레이크·출입문·냉난방.' },
  ] },
  AMT: { basis: '2025년 사업 보고서', rows: [
    { n: '미국·캐나다 통신탑', r: 50, p: 60, c: 'bg-blue-700', note: '통신사에 탑 자리를 빌려주고 장기 임대료를 받는다(매년 약 3% 인상).' },
    { n: '해외 통신탑', r: 38, p: 28, c: 'bg-emerald-500', note: '중남미·유럽·아프리카 탑.' },
    { n: '데이터센터(코어사이트)', r: 12, p: 12, c: 'bg-violet-500', note: '도시 데이터센터 임대.' },
  ] },
  LDOS: { basis: '2025년 사업 보고서', rows: [
    { n: '국가 안보·정보', r: 43, p: 42, c: 'bg-gray-700', note: '정보기관·국방부 IT 시스템.' },
    { n: '정부 민간 부처', r: 26, p: 22, c: 'bg-blue-600', note: '연방항공청·보훈부 시스템.' },
    { n: '보건', r: 18, p: 26, c: 'bg-emerald-500', note: '보훈 장애 심사, 국방부 의료 기록.' },
    { n: '상업·국제', r: 13, p: 10, c: 'bg-amber-500', note: '공항 보안 검색기 등.' },
  ] },
  CHD: { basis: '2025년 사업 보고서', rows: [
    { n: '미국 생활용품', r: 77, p: 75, c: 'bg-blue-600', u: [8, '개', '암앤해머 세제·베이킹소다'], note: '암앤해머 세제·베이킹소다, 트로잔, 워터픽, 비타민.' },
    { n: '해외', r: 18, p: 18, c: 'bg-emerald-500', note: '같은 브랜드 해외 판매.' },
    { n: '동물 사료 첨가제', r: 5, p: 7, c: 'bg-amber-600', note: '젖소 사료 첨가제.' },
  ] },
  EFX: { basis: '2025년 사업 보고서', rows: [
    { n: '근로·소득 확인(워크넘버)', r: 41, p: 55, c: 'bg-blue-700', note: '은행·정부가 대출·복지 심사 때 소득을 확인하는 데이터베이스. 이익률이 가장 높다.' },
    { n: '미국 신용정보', r: 35, p: 32, c: 'bg-emerald-500', note: '신용 보고서 판매.' },
    { n: '해외', r: 24, p: 13, c: 'bg-gray-400', note: '캐나다·영국·호주·중남미 신용정보.' },
  ] },
  AOS: { basis: '2025년 사업 보고서', rows: [
    { n: '북미 온수기·보일러', r: 77, p: 85, c: 'bg-blue-600', u: [1200, '대', '가정용 온수기'], note: '가정·상업용 온수기 미국 1위. 고장 나면 바로 바꿔야 하는 교체 수요가 대부분.' },
    { n: '해외(중국·인도)', r: 23, p: 15, c: 'bg-red-500', note: '중국 온수기·정수기.' },
  ] },
  SBAC: { basis: '2025년 사업 보고서', rows: [
    { n: '통신탑 임대', r: 90, p: 100, c: 'bg-blue-700', note: '통신사에 탑 자리를 장기 임대. 미국·중남미.' },
    { n: '탑 설치 공사', r: 10, p: 0, c: 'bg-gray-400', note: '통신 장비 설치 공사. 거의 남지 않는다.' },
  ] },
  FDS: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '미주', r: 64, p: 66, c: 'bg-blue-700', note: '운용사·투자은행 직원이 쓰는 금융 데이터 단말기 구독.' },
    { n: '유럽·중동·아프리카', r: 27, p: 25, c: 'bg-emerald-500', note: '같은 서비스.' },
    { n: '아시아·태평양', r: 9, p: 9, c: 'bg-amber-500', note: '같은 서비스.' },
  ] },
  MKC: { basis: '2025년 사업 보고서', rows: [
    { n: '마트 판매(향신료·소스)', r: 58, p: 68, c: 'bg-red-600', u: [5, '병', '향신료 한 병'], note: '맥코믹 향신료, 프랭크스 핫소스, 프렌치 머스터드.' },
    { n: '식품 회사 납품(맛 원료)', r: 42, p: 32, c: 'bg-amber-500', note: '패스트푸드·과자 회사에 양념 원료 공급.' },
  ] },
  // ── ⑦ 이익 주춤 ──
  BX: { basis: '2025년 사업 보고서', rows: [
    { n: '부동산 펀드', r: 30, p: 26, c: 'bg-amber-600', note: '세계 최대 부동산 투자. 운용 수수료·성과 보수.' },
    { n: '사모펀드', r: 28, p: 30, c: 'bg-gray-700', note: '기업 인수 펀드.' },
    { n: '신용·보험 자산', r: 27, p: 28, c: 'bg-blue-600', note: '사모 대출, 보험사 자산 운용.' },
    { n: '헤지펀드 묶음', r: 15, p: 16, c: 'bg-emerald-500', note: '여러 헤지펀드에 나눠 투자.' },
  ] },
  ABBV: { basis: '2025년 사업 보고서', rows: [
    { n: '면역질환 약(스카이리치·린버크)', r: 50, p: 58, c: 'bg-blue-600', note: '건선·관절염·장염 약. 특허 끝난 휴미라를 대신해 빠르게 큰다.' },
    { n: '신경과학(보톡스 치료·편두통·정신과)', r: 18, p: 16, c: 'bg-violet-500', note: '보톡스 치료용, 우브렐비·바이랄라.' },
    { n: '항암제(벤클렉스타 등)', r: 11, p: 9, c: 'bg-red-500', note: '혈액암 약.' },
    { n: '미용(보톡스·필러)', r: 9, p: 9, c: 'bg-pink-400', note: '미용 보톡스, 쥬비덤 필러.' },
    { n: '휴미라 등 기타', r: 12, p: 8, c: 'bg-gray-400', note: '복제약 경쟁으로 줄고 있다.' },
  ] },
  NOC: { basis: '2025년 사업 보고서', rows: [
    { n: '항공(B-21 폭격기 등)', r: 29, p: 20, c: 'bg-gray-700', note: 'B-21 스텔스 폭격기. 초기 생산 손실이 있다.' },
    { n: '방산 전자', r: 19, p: 25, c: 'bg-blue-600', note: '레이더·전자전 장비.' },
    { n: '미사일·우주 발사', r: 21, p: 23, c: 'bg-red-600', note: '대륙간 탄도미사일(센티넬), 로켓 모터.' },
    { n: '우주', r: 31, p: 32, c: 'bg-violet-500', note: '위성·미사일 방어.' },
  ] },
  TXN: { basis: '2025년 사업 보고서', rows: [
    { n: '아날로그 칩', r: 79, p: 88, c: 'bg-red-600', u: [0.4, '개', '아날로그 칩 한 개(평균)'], note: '전압 조절·신호 변환 칩. 자동차·공장 기계에 수십 개씩 들어간다.' },
    { n: '프로세서(임베디드)', r: 16, p: 10, c: 'bg-blue-600', note: '가전·자동차 제어용 소형 칩.' },
    { n: '기타', r: 5, p: 2, c: 'bg-gray-400', note: '계산기 등.' },
  ] },
  ABT: { basis: '2025년 사업 보고서', rows: [
    { n: '의료 기기', r: 46, p: 52, c: 'bg-blue-600', note: '연속 혈당 측정기 리브레(이익 효자), 심장 박동기·판막.' },
    { n: '진단 검사', r: 21, p: 18, c: 'bg-sky-400', note: '병원 혈액 검사 장비·시약.' },
    { n: '영양식', r: 19, p: 17, c: 'bg-amber-500', note: '분유(시밀락), 성인 영양식(엔슈어).' },
    { n: '복제약(해외)', r: 14, p: 13, c: 'bg-gray-500', note: '신흥국 브랜드 복제약.' },
  ] },
  IRM: { basis: '2025년 사업 보고서', rows: [
    { n: '문서 보관 창고', r: 60, p: 70, c: 'bg-gray-600', u: [0.3, '상자', '문서 상자 한 달 보관'], note: '회사·병원 서류 상자를 보관하고 월 보관료를 받는다. 한번 맡기면 거의 안 찾아간다.' },
    { n: '데이터센터', r: 15, p: 15, c: 'bg-violet-500', note: '데이터센터 임대. 빠르게 성장.' },
    { n: '문서 파쇄·디지털화·IT 장비 폐기', r: 25, p: 15, c: 'bg-emerald-500', note: '서버 재활용·파쇄 서비스.' },
  ] },
  AWK: { basis: '2025년 사업 보고서', rows: [
    { n: '수도 요금(규제 사업)', r: 92, p: 95, c: 'bg-sky-500', u: [60, '달', '가정 한 달 수도 요금'], note: '미국 14개 주 약 1,400만 명에게 수돗물·하수 서비스. 요금을 정부가 정해 안정적.' },
    { n: '군부대 수도 위탁 등', r: 8, p: 5, c: 'bg-gray-400', note: '군 기지 상하수도 운영.' },
  ] },
  APD: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '미주 산업 가스', r: 42, p: 45, c: 'bg-blue-600', note: '공장에 산소·질소·수소를 파이프로 장기 공급.' },
    { n: '아시아', r: 26, p: 28, c: 'bg-red-500', note: '중국·한국 반도체 공장용 가스.' },
    { n: '유럽', r: 23, p: 22, c: 'bg-emerald-500', note: '유럽 산업 가스.' },
    { n: '중동·대형 설비', r: 9, p: 5, c: 'bg-gray-400', note: '사우디 합작 등. 대형 청정 수소 사업은 축소.' },
  ] },
  LYV: { basis: '2025년 사업 보고서', rows: [
    { n: '공연 기획·운영', r: 78, p: 25, c: 'bg-red-600', note: '공연을 열고 표 값을 받지만 가수 출연료로 대부분 나간다.' },
    { n: '티켓 판매(티켓마스터)', r: 13, p: 50, c: 'bg-blue-600', u: [12, '장', '티켓 수수료(장당 평균)'], note: '표 한 장마다 수수료. 이익의 핵심.' },
    { n: '공연장 광고·후원', r: 9, p: 25, c: 'bg-amber-500', note: '공연장 이름 붙이기, 기업 후원.' },
  ] },
  MRK: { basis: '2025년 사업 보고서', rows: [
    { n: '키트루다(면역 항암제)', r: 48, p: 55, c: 'bg-blue-700', note: '세계에서 가장 많이 팔리는 약. 2028년 특허 만료가 걱정거리.' },
    { n: '백신(가다실 등)', r: 14, p: 12, c: 'bg-emerald-500', note: '자궁경부암 백신 가다실(중국 부진), 폐렴 백신.' },
    { n: '기타 전문 의약품', r: 27, p: 25, c: 'bg-sky-500', note: '당뇨·심장·감염 약, 새 폐고혈압 약 윈레브에어.' },
    { n: '동물 의약품', r: 11, p: 8, c: 'bg-amber-500', note: '반려동물 진드기 약(브라벡토), 가축 백신.' },
  ] },
  QCOM: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '휴대폰 칩(스냅드래곤)', r: 64, p: 45, c: 'bg-red-600', note: '안드로이드 고급폰 두뇌 칩. 애플이 자체 통신 칩으로 바꾸는 중.' },
    { n: '자동차 칩', r: 9, p: 5, c: 'bg-blue-600', note: '차량 화면·자율주행 칩. 빠르게 성장.' },
    { n: '사물인터넷·PC 칩', r: 15, p: 8, c: 'bg-gray-500', note: 'PC·VR 기기·공장 장비 칩.' },
    { n: '특허 사용료(QTL)', r: 12, p: 42, c: 'bg-emerald-500', note: '거의 모든 휴대폰 회사가 통신 특허료를 낸다. 매출의 12%로 이익의 40% 이상.' },
  ] },
  GILD: { basis: '2025년 사업 보고서', rows: [
    { n: 'HIV 약(빅타비 등)', r: 68, p: 80, c: 'bg-red-600', note: '에이즈 바이러스 치료·예방약. 1년에 두 번 맞는 예방 주사 예즈투고 출시.' },
    { n: '항암제(트로델비·세포치료)', r: 11, p: 2, c: 'bg-violet-500', note: '유방암 약, 혈액암 세포 치료제. 아직 이익이 작다.' },
    { n: '간질환 약', r: 12, p: 13, c: 'bg-amber-500', note: 'C형·B형 간염 약.' },
    { n: '기타(코로나 약 등)', r: 9, p: 5, c: 'bg-gray-400', note: '베클러리(렘데시비르) 등.' },
  ] },
  PSA: { basis: '2025년 사업 보고서', rows: [
    { n: '미국 개인 창고 임대', r: 92, p: 92, c: 'bg-orange-500', u: [180, '달', '창고 한 칸 한 달 임대료'], note: '이사·정리할 짐을 맡기는 창고 약 3,000곳. 한번 넣으면 오래 둔다.' },
    { n: '보관 물품 보험 등', r: 6, p: 5, c: 'bg-gray-400', note: '맡긴 짐 보험.' },
    { n: '유럽 창고(쉬르가드 지분)', r: 2, p: 3, c: 'bg-emerald-500', note: '유럽 창고 회사 지분 이익.' },
  ] },
  TTWO: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '모바일 게임(징가)', r: 52, p: 35, c: 'bg-emerald-500', note: '워즈 위드 프렌즈, 토이 블래스트 등. 게임 안 결제.' },
    { n: '콘솔·PC 게임(GTA·NBA 2K)', r: 40, p: 60, c: 'bg-gray-800', u: [70, '장', '게임 한 장'], note: 'GTA 5·GTA 온라인, NBA 2K. GTA 6 출시가 2026년 11월로 예정.' },
    { n: '기타', r: 8, p: 5, c: 'bg-gray-400', note: '광고 등.' },
  ], how: '게임 인수 비용 상각 때문에 장부상 손실이 나는 해가 많다.' },
  MDLZ: { basis: '2025년 사업 보고서', rows: [
    { n: '비스킷(오레오·리츠)', r: 48, p: 50, c: 'bg-blue-800', u: [5, '봉지', '오레오 한 봉지'], note: '오레오·리츠·트리스킷. 세계 비스킷 1위.' },
    { n: '초콜릿(캐드버리·밀카·토블론)', r: 30, p: 25, c: 'bg-violet-700', note: '카카오 값 폭등으로 이익이 줄었다.' },
    { n: '사탕·껌·치즈 등', r: 22, p: 25, c: 'bg-pink-400', note: '홀스 사탕, 트라이던트 껌 등.' },
  ] },
  BDX: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '의료 소모품(주사기·수액)', r: 47, p: 48, c: 'bg-blue-600', note: '주사기·바늘·수액 펌프. 병원 필수품.' },
    { n: '시술 기구', r: 25, p: 27, c: 'bg-red-500', note: '혈관 시술·비뇨기·수술 봉합 기구.' },
    { n: '생명과학·진단(분사 예정)', r: 28, p: 25, c: 'bg-gray-400', note: '진단 검사·세포 분석 장비. 워터스와 합병해 떼어 낸다.' },
  ] },
  REGN: { basis: '2025년 사업 보고서', rows: [
    { n: '듀피젠트 이익 배분(사노피 공동)', r: 40, p: 55, c: 'bg-blue-600', note: '아토피·천식 주사약 듀피젠트. 사노피와 이익을 나눠 받는다.' },
    { n: '아일리아(눈 질환 주사)', r: 30, p: 25, c: 'bg-emerald-500', note: '황반변성 주사. 복제약 경쟁으로 줄고 있다.' },
    { n: '리브타요·기타', r: 30, p: 20, c: 'bg-gray-400', note: '항암제, 위탁 생산 수입 등.' },
  ] },
  DIS: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '테마파크·크루즈·상품', r: 38, p: 58, c: 'bg-blue-600', u: [180, '장', '디즈니월드 1일 입장권'], note: '디즈니랜드·디즈니월드·크루즈. 이익의 절반 이상.' },
    { n: '스트리밍·영화·TV(엔터테인먼트)', r: 44, p: 25, c: 'bg-violet-600', note: '디즈니+·훌루, 마블·픽사 영화, ABC 방송.' },
    { n: '스포츠(ESPN)', r: 18, p: 17, c: 'bg-red-600', note: 'ESPN 방송·스트리밍.' },
  ] },
  XOM: { basis: '2025년 사업 보고서', rows: [
    { n: '원유·가스 생산', r: 30, p: 70, c: 'bg-gray-800', u: [65, '배럴', '원유 1배럴'], note: '미국 퍼미안·남미 가이아나 유전. 이익의 대부분.' },
    { n: '정유·주유소(에너지 제품)', r: 55, p: 18, c: 'bg-red-600', note: '휘발유·경유 정제와 판매. 매출은 크지만 남는 돈은 적다.' },
    { n: '화학제품', r: 10, p: 6, c: 'bg-blue-500', note: '플라스틱 원료.' },
    { n: '윤활유 등 특수 제품', r: 5, p: 6, c: 'bg-amber-500', note: '모빌 엔진오일.' },
  ] },
  'BF-B': { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '잭다니엘스 위스키 계열', r: 70, p: 75, c: 'bg-gray-800', u: [30, '병', '잭다니엘스 한 병'], note: '테네시 위스키 잭다니엘스. 미국 관세·소비 둔화로 판매 감소.' },
    { n: '버번·기타 위스키', r: 15, p: 15, c: 'bg-amber-700', note: '우드포드리저브·올드포레스터.' },
    { n: '데킬라·진·기타', r: 15, p: 10, c: 'bg-emerald-500', note: '엘 히마도르 데킬라 등.' },
  ] },
  // ── ⑨ 역발상 후보 ──
  FISV: { basis: '2025년 사업 보고서', rows: [
    { n: '가맹점 결제(클로버 등)', r: 50, p: 50, c: 'bg-emerald-600', note: '가게 카드 단말기 클로버, 온라인 결제 처리. 클로버 성장 둔화로 주가 급락.' },
    { n: '금융기관 시스템', r: 50, p: 50, c: 'bg-blue-700', note: '은행 계좌 관리 시스템, 카드 발급 처리.' },
  ] },
  CMCSA: { basis: '2025년 사업 보고서', rows: [
    { n: '인터넷·케이블TV(엑스피니티)', r: 64, p: 72, c: 'bg-blue-700', u: [80, '달', '인터넷 한 달 요금'], note: '미국 가정 인터넷·케이블TV·휴대폰. 인터넷 가입자가 조금씩 줄고 있다.' },
    { n: 'NBC 방송·피콕 스트리밍', r: 20, p: 10, c: 'bg-violet-500', note: '방송국, 스트리밍(피콕). 케이블 채널은 분사.' },
    { n: '테마파크(유니버설)', r: 7, p: 12, c: 'bg-amber-500', note: '유니버설 스튜디오. 에픽 유니버스 개장.' },
    { n: '영화 스튜디오', r: 9, p: 6, c: 'bg-red-500', note: '유니버설 영화.' },
  ] },
  FIS: { basis: '2025년 사업 보고서', rows: [
    { n: '은행 시스템', r: 75, p: 80, c: 'bg-blue-700', note: '은행 계좌·대출 관리 시스템, 디지털 뱅킹.' },
    { n: '자본시장 소프트웨어', r: 25, p: 20, c: 'bg-violet-500', note: '증권사·운용사 거래 처리 소프트웨어.' },
  ] },
  WY: { basis: '2025년 사업 보고서', rows: [
    { n: '목재·합판 생산', r: 70, p: 30, c: 'bg-amber-700', note: '건축용 목재·OSB 합판. 집 짓기가 줄면 값이 떨어진다.' },
    { n: '숲(벌목)', r: 25, p: 55, c: 'bg-green-700', note: '미국 숲 약 1,000만 에이커 소유. 나무를 베어 판다.' },
    { n: '땅 판매·탄소 사업', r: 5, p: 15, c: 'bg-emerald-400', note: '숲 일부를 개발용으로 팔기.' },
  ] },
  GIS: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '북미 마트 식품', r: 60, p: 62, c: 'bg-amber-500', u: [5, '상자', '치리오스 시리얼 한 상자'], note: '치리오스 시리얼, 하겐다즈, 필스버리 반죽, 요플레(일부 매각).' },
    { n: '반려동물 사료(블루버팔로)', r: 18, p: 20, c: 'bg-blue-600', note: '프리미엄 개 사료.' },
    { n: '해외', r: 12, p: 8, c: 'bg-emerald-500', note: '해외 식품.' },
    { n: '외식업체 납품', r: 10, p: 10, c: 'bg-gray-500', note: '학교·식당용 식재료.' },
  ] },
  CHTR: { basis: '2025년 사업 보고서', rows: [
    { n: '인터넷', r: 41, p: 55, c: 'bg-blue-700', u: [80, '달', '인터넷 한 달 요금'], note: '미국 41개 주 가정 인터넷(스펙트럼). 가입자가 줄고 있다.' },
    { n: '케이블TV', r: 27, p: 12, c: 'bg-gray-500', note: '방송 채널료가 비싸 거의 남지 않는다.' },
    { n: '휴대폰', r: 8, p: 8, c: 'bg-emerald-500', note: '인터넷 고객에게 싸게 파는 휴대폰 요금제. 빠르게 성장.' },
    { n: '기업 통신·광고 등', r: 24, p: 25, c: 'bg-amber-500', note: '중소기업 인터넷, 지역 광고.' },
  ] },
  LVS: { basis: '2025년 사업 보고서', rows: [
    { n: '마카오 카지노 리조트', r: 63, p: 55, c: 'bg-red-600', note: '베네치안 마카오 등. 중국 경기 둔화로 회복이 느리다.' },
    { n: '싱가포르 마리나베이샌즈', r: 37, p: 45, c: 'bg-blue-600', note: '건물 위 수영장으로 유명한 리조트. 이익률이 높다.' },
  ] },
  APTV: { basis: '2025년 사업 보고서', rows: [
    { n: '차량 배선·전력 부품', r: 60, p: 55, c: 'bg-amber-600', note: '자동차 전선 묶음·커넥터. 분사 예정.' },
    { n: '차량 두뇌·소프트웨어(첨단 안전)', r: 40, p: 45, c: 'bg-blue-600', note: '자율주행 보조 장치, 차량 컴퓨터, 소프트웨어(윈드리버).' },
  ] },
  CLX: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '청소용품(클로락스 표백제·물티슈)', r: 35, p: 38, c: 'bg-blue-600', u: [5, '통', '클로락스 표백제 한 통'], note: '표백제·소독 물티슈. 2023년 해킹 이후 점유율 회복 중.' },
    { n: '생활용품(글래드 비닐·킹스포드 숯)', r: 28, p: 22, c: 'bg-gray-600', note: '쓰레기 봉투·숯·고양이 모래.' },
    { n: '생활 건강(브리타·버츠비)', r: 22, p: 25, c: 'bg-sky-400', note: '정수기 필터, 립밤, 샐러드 드레싱(히든밸리).' },
    { n: '해외', r: 15, p: 15, c: 'bg-emerald-500', note: '해외 판매.' },
  ] },
  LUV: { basis: '2025년 사업 보고서', rows: [
    { n: '항공권', r: 88, p: 60, c: 'bg-blue-600', u: [160, '장', '편도 항공권(평균)'], note: '미국 국내선. 자유석·수하물 무료를 없애고 요금 체계를 바꾸는 중.' },
    { n: '마일리지 판매(제휴 카드)', r: 9, p: 35, c: 'bg-amber-500', note: '체이스 카드사에 마일리지를 판다. 이익률이 높다.' },
    { n: '기타', r: 3, p: 5, c: 'bg-gray-400', note: '화물 등.' },
  ] },
  BXP: { basis: '2025년 사업 보고서', rows: [
    { n: '보스턴·뉴욕 사무실', r: 60, p: 62, c: 'bg-blue-700', note: '최고급 사무실 빌딩 임대.' },
    { n: '샌프란시스코·워싱턴 등', r: 40, p: 38, c: 'bg-gray-500', note: '샌프란시스코는 재택근무로 공실이 많다.' },
  ] },
  ARE: { basis: '2025년 사업 보고서', rows: [
    { n: '바이오 연구소 임대', r: 100, c: 'bg-emerald-600', note: '보스턴·샌프란시스코·샌디에이고 바이오 연구소 단지 임대. 바이오 투자 위축으로 공실 증가.' },
  ] },
  HRL: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '마트 판매(스팸·스키피·플랜터스)', r: 60, p: 58, c: 'bg-red-600', u: [4, '캔', '스팸 한 캔'], note: '스팸 통조림, 땅콩버터, 땅콩 과자.' },
    { n: '외식업체 납품', r: 34, p: 38, c: 'bg-amber-600', note: '식당용 베이컨·피자 토핑 고기.' },
    { n: '해외', r: 6, p: 4, c: 'bg-emerald-500', note: '해외 판매.' },
  ] },
  WYNN: { basis: '2025년 사업 보고서', rows: [
    { n: '마카오 카지노', r: 53, p: 45, c: 'bg-red-600', note: '윈 팰리스·윈 마카오.' },
    { n: '라스베이거스', r: 35, p: 40, c: 'bg-amber-500', note: '윈·앙코르 라스베이거스.' },
    { n: '보스턴(앙코르 보스턴하버)', r: 12, p: 15, c: 'bg-blue-600', note: '보스턴 카지노. 아랍에미리트 리조트 2027년 개장 예정.' },
  ] },
  HAL: { basis: '2025년 사업 보고서', rows: [
    { n: '셰일 시추 완공(수압 파쇄 등)', r: 57, p: 55, c: 'bg-red-700', note: '유정을 다 판 뒤 물·모래를 강하게 밀어 넣어 기름을 뽑게 하는 작업.' },
    { n: '시추·탐사 서비스', r: 43, p: 45, c: 'bg-gray-600', note: '땅 속 측정, 시추 장비 대여.' },
  ] },
  BAX: { basis: '2025년 사업 보고서', rows: [
    { n: '수액·의약품 주사', r: 50, p: 55, c: 'bg-blue-600', note: '수액·마취제·주사 약.' },
    { n: '병원 장비(힐롬)', r: 50, p: 45, c: 'bg-gray-500', note: '병원 침대·환자 감시 장비·수액 펌프.' },
  ] },
  BIIB: { basis: '2025년 사업 보고서', rows: [
    { n: '다발성 경화증 약', r: 40, p: 50, c: 'bg-blue-600', note: '타이사브리 등. 복제약으로 줄고 있다.' },
    { n: '척수성 근위축증(스핀라자)', r: 15, p: 15, c: 'bg-emerald-500', note: '희귀 유전병 주사.' },
    { n: '새 약(산후우울증·알츠하이머·희귀병)', r: 15, p: 5, c: 'bg-violet-500', note: '쥬주베, 레켐비(에자이 공동), 스카이클라리스.' },
    { n: '바이오시밀러·위탁 생산 등', r: 30, p: 30, c: 'bg-gray-400', note: '복제 바이오 의약품, 위탁 생산, 로열티.' },
  ] },
  KHC: { basis: '2025년 사업 보고서', rows: [
    { n: '북미 식품', r: 75, p: 78, c: 'bg-red-600', u: [4, '병', '하인즈 케첩 한 병'], note: '하인즈 케첩, 크래프트 마카로니 치즈, 오스카마이어. 회사를 둘로 나누는 중.' },
    { n: '해외', r: 25, p: 22, c: 'bg-emerald-500', note: '해외 하인즈 소스 등.' },
  ] },
  MOS: { basis: '2025년 사업 보고서', rows: [
    { n: '인산 비료', r: 40, p: 30, c: 'bg-amber-600', note: '작물 뿌리를 키우는 인산 비료.' },
    { n: '칼륨 비료', r: 25, p: 50, c: 'bg-red-500', note: '캐나다 광산 칼륨. 이익률이 높다.' },
    { n: '브라질 비료 유통', r: 35, p: 20, c: 'bg-green-600', note: '브라질 농가 비료 판매.' },
  ] },
  NCLH: { basis: '2025년 사업 보고서', rows: [
    { n: '크루즈 승선료', r: 65, p: 60, c: 'bg-blue-600', u: [1600, '명', '7박 크루즈 1인 요금(평균)'], note: '노르웨이지안·오셔니아·리젠트 크루즈.' },
    { n: '선상 소비', r: 35, p: 40, c: 'bg-amber-500', note: '술·카지노·기항지 관광·스파.' },
  ], how: '빚이 많아 이자 비용이 크다.' },
  SLB: { basis: '2025년 사업 보고서', rows: [
    { n: '유정 생산 관리', r: 35, p: 30, c: 'bg-blue-700', note: '유정 펌프·완공 장비, 생산 시스템(챔피언X 인수).' },
    { n: '시추', r: 25, p: 27, c: 'bg-gray-700', note: '시추 장비·기술.' },
    { n: '해저·지상 설비', r: 25, p: 22, c: 'bg-sky-500', note: '해저 유전 설비(원서브시).' },
    { n: '디지털·탐사', r: 15, p: 21, c: 'bg-violet-500', note: '지하 데이터 분석 소프트웨어. 이익률이 높다.' },
  ] },
  CCL: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '크루즈 승선료', r: 63, p: 58, c: 'bg-blue-600', u: [900, '명', '크루즈 1인 요금(평균)'], note: '카니발·프린세스·코스타 등 세계 최대 크루즈 회사.' },
    { n: '선상 소비', r: 37, p: 42, c: 'bg-amber-500', note: '술·카지노·기항지 관광.' },
  ], how: '코로나 때 진 빚을 갚는 중이라 이자 비용이 크다.' },
  PCG: { basis: '2025년 사업 보고서', rows: [
    { n: '전기', r: 75, p: 75, c: 'bg-amber-500', u: [180, '달', '가정 한 달 전기 요금'], note: '북캘리포니아 약 1,600만 명에게 전기 공급. 산불 배상 위험이 크다.' },
    { n: '가스', r: 25, p: 25, c: 'bg-blue-600', note: '가정 난방·요리용 가스.' },
  ] },
  // ── A등급·기타 ──
  BRO: { basis: '2025년 사업 보고서', rows: [
    { n: '소매 보험 중개', r: 50, p: 45, c: 'bg-blue-700', note: '중소기업·개인 보험 중개.' },
    { n: '도매·전문 보험 중개', r: 33, p: 37, c: 'bg-emerald-500', note: '다른 중개사를 위한 특수 보험 설계, 대리 인수.' },
    { n: '프로그램(대리 인수)', r: 17, p: 18, c: 'bg-amber-500', note: '보험사를 대신해 계약을 심사.' },
  ] },
  CME: { basis: '2025년 사업 보고서', rows: [
    { n: '금리 선물·옵션', r: 33, p: 37, c: 'bg-blue-700', note: '미국 국채·금리 선물. 금리 전망이 흔들릴수록 거래가 는다.' },
    { n: '주가지수 선물', r: 16, p: 17, c: 'bg-emerald-500', note: 'S&P500 선물 등.' },
    { n: '원유·가스·농산물·금속', r: 27, p: 28, c: 'bg-amber-600', note: '원유·옥수수·금 선물.' },
    { n: '시세 데이터·기타', r: 24, p: 18, c: 'bg-gray-500', note: '시세 판매, 외환 거래 등.' },
  ], how: '거래 1건마다 수수료를 받아, 비용이 거의 늘지 않고 이익률이 60%를 넘는다.' },
  HWM: { basis: '2025년 사업 보고서', rows: [
    { n: '항공기 엔진 부품', r: 52, p: 60, c: 'bg-blue-700', note: '제트 엔진 터빈 날개(초고온 합금). 세계 몇 곳만 만든다.' },
    { n: '항공기 고정 부품(볼트·리벳)', r: 22, p: 20, c: 'bg-gray-500', note: '비행기 동체 특수 볼트.' },
    { n: '구조 부품', r: 10, p: 7, c: 'bg-sky-500', note: '티타늄 구조물.' },
    { n: '트럭 휠', r: 16, p: 13, c: 'bg-amber-500', note: '대형 트럭 알루미늄 휠.' },
  ] },
  KLAC: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '반도체 공정 검사 장비', r: 90, p: 93, c: 'bg-blue-700', note: '웨이퍼에 먼지·결함이 있는지 찾는 장비. 시장 점유율 50% 이상.' },
    { n: '특수 반도체 장비', r: 5, p: 4, c: 'bg-violet-500', note: '전력·화합물 반도체 공정 장비.' },
    { n: '회로 기판·디스플레이 검사', r: 5, p: 3, c: 'bg-gray-400', note: '인쇄 회로 기판 검사 장비.' },
  ], how: '정비·부품 서비스가 매출의 약 20%를 차지해 경기가 나빠도 버팀목이 된다.' },
  LOW: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '일반 고객(직접 고치는 사람)', r: 70, p: 66, c: 'bg-blue-600', note: '집 수리·정원 용품을 사는 개인. 소비 둔화로 부진.' },
    { n: '전문 시공업자(프로)', r: 30, p: 34, c: 'bg-amber-500', note: '목수·배관공 등 업자. 인수(FBM 등)로 키우는 중.' },
  ] },
  PGR: { basis: '2025년 사업 보고서', rows: [
    { n: '개인 자동차 보험', r: 80, p: 82, c: 'bg-blue-600', u: [1600, '건', '자동차 보험 6개월 계약(평균)'], note: '미국 2위 자동차 보험. 운전 습관을 측정해 보험료를 정한다.' },
    { n: '상업용 차량 보험', r: 12, p: 10, c: 'bg-gray-600', note: '트럭·업무용 차량 보험.' },
    { n: '주택 보험', r: 5, p: 2, c: 'bg-amber-500', note: '주택 보험. 자연재해에 취약.' },
    { n: '투자 수익', r: 3, p: 6, c: 'bg-emerald-500', note: '받은 보험료를 굴린 이자.' },
  ] },
  TMUS: { basis: '2025년 사업 보고서', rows: [
    { n: '후불 요금제 서비스', r: 64, p: 72, c: 'bg-pink-600', u: [50, '달', '휴대폰 한 달 요금(회선당)'], note: '매달 요금을 내는 가입자. 미국에서 가입자를 가장 많이 늘리는 통신사.' },
    { n: '선불 요금제', r: 12, p: 12, c: 'bg-violet-500', note: '미리 충전해 쓰는 요금제(메트로).' },
    { n: '휴대폰 기기 판매', r: 20, p: 6, c: 'bg-gray-500', note: '휴대폰 할부 판매. 거의 원가.' },
    { n: '도매·기타', r: 4, p: 10, c: 'bg-gray-400', note: '다른 통신사에 망을 빌려준다.' },
  ] },
  VMC: { basis: '2025년 사업 보고서', rows: [
    { n: '골재(돌·모래·자갈)', r: 75, p: 90, c: 'bg-gray-600', u: [22, '톤', '골재 1톤'], note: '미국 최대 골재 회사. 채석장 근처 지역 독점이라 가격을 해마다 올린다.' },
    { n: '아스팔트', r: 15, p: 6, c: 'bg-gray-800', note: '도로 포장용 아스팔트.' },
    { n: '레미콘', r: 10, p: 4, c: 'bg-gray-400', note: '건설 현장용 콘크리트.' },
  ] },
  VRSN: { basis: '2025년 사업 보고서', rows: [
    { n: '.com·.net 도메인 등록', r: 100, c: 'bg-blue-700', u: [10.26, '개', '.com 도메인 1년 등록'], note: '세계 모든 .com·.net 주소의 등록 관리를 독점. 등록 1건마다 정부가 허락한 요금을 받는다. 영업이익률 약 68%.' },
  ] },
  WM: { basis: '2025년 사업 보고서', rows: [
    { n: '쓰레기 수거', r: 55, p: 45, c: 'bg-green-700', u: [35, '달', '가정 한 달 쓰레기 수거료'], note: '집·가게·공장 쓰레기 수거.' },
    { n: '매립지', r: 16, p: 30, c: 'bg-gray-700', note: '미국 최대 매립지 보유. 새 매립지 허가가 거의 안 나 가치가 크다.' },
    { n: '중간 집하·재활용', r: 14, p: 10, c: 'bg-sky-500', note: '쓰레기 옮겨 싣기, 재활용 선별.' },
    { n: '의료 폐기물(스테리사이클)·기타', r: 15, p: 15, c: 'bg-red-500', note: '병원 폐기물, 매립지 가스 발전.' },
  ] },
  AXP: { basis: '2025년 사업 보고서', rows: [
    { n: '미국 개인 카드', r: 45, p: 50, c: 'bg-blue-700', u: [895, '년', '플래티넘 카드 연회비'], note: '플래티넘·골드 카드. 연회비와 결제 수수료, 카드 대출 이자.' },
    { n: '기업·법인 카드', r: 25, p: 20, c: 'bg-gray-600', note: '중소기업·대기업 출장비 카드.' },
    { n: '해외 카드·가맹점', r: 30, p: 30, c: 'bg-emerald-500', note: '해외 카드, 가맹점 결제 수수료.' },
  ] },
  PWR: { basis: '2025년 사업 보고서', rows: [
    { n: '전력망·데이터센터 전기 공사', r: 75, p: 85, c: 'bg-amber-500', note: '송전탑·변전소·데이터센터 전기 설비 공사. 전력망 투자 수혜.' },
    { n: '가스관·지하 시설 공사', r: 25, p: 15, c: 'bg-gray-600', note: '가스 배관·통신 지하 시설.' },
  ] },
  RSG: { basis: '2025년 사업 보고서', rows: [
    { n: '쓰레기 수거', r: 65, p: 55, c: 'bg-green-700', u: [35, '달', '가정 한 달 쓰레기 수거료'], note: '미국 2위 쓰레기 수거.' },
    { n: '매립지·중간 집하', r: 20, p: 32, c: 'bg-gray-700', note: '매립지 사용료.' },
    { n: '산업 폐기물·재활용', r: 15, p: 13, c: 'bg-sky-500', note: '유해 폐기물, 재활용품 판매.' },
  ] },
  ICE: { basis: '2025년 사업 보고서', rows: [
    { n: '거래소(원유 선물·뉴욕증권거래소)', r: 52, p: 60, c: 'bg-blue-700', note: '브렌트유 선물, 뉴욕증권거래소 상장·거래.' },
    { n: '채권 데이터·거래', r: 25, p: 25, c: 'bg-emerald-500', note: '채권 가격 데이터·지수.' },
    { n: '주택담보대출 소프트웨어', r: 23, p: 15, c: 'bg-amber-500', note: '대출 심사·관리 소프트웨어(엘리 메이·블랙나이트).' },
  ] },
  ETN: { basis: '2025년 사업 보고서', rows: [
    { n: '미주 전력 장비', r: 47, p: 55, c: 'bg-blue-700', note: '데이터센터·건물 배전반·변압기. 이익률 27%.' },
    { n: '해외 전력 장비', r: 28, p: 22, c: 'bg-emerald-500', note: '유럽·아시아 전력 장비, 냉각 장비(보이드 인수).' },
    { n: '항공 부품', r: 15, p: 15, c: 'bg-sky-500', note: '항공기 연료·유압 부품.' },
    { n: '자동차·모빌리티', r: 10, p: 8, c: 'bg-gray-400', note: '트럭 변속기 등(분사 예정).' },
  ] },
  GWW: { basis: '2025년 사업 보고서', rows: [
    { n: '대면 영업(그레인저 북미)', r: 80, p: 88, c: 'bg-red-600', note: '공장·병원·학교 유지보수용 공구·안전용품·부품을 영업 사원과 지점이 공급.' },
    { n: '온라인 무한 상품(잔로·모노타로)', r: 20, p: 12, c: 'bg-sky-500', note: '수백만 가지 상품을 온라인으로 파는 미국 잔로, 일본 모노타로.' },
  ] },
  PH: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '북미 산업용 부품', r: 40, p: 40, c: 'bg-blue-700', note: '유압 실린더·밸브·필터·씰.' },
    { n: '해외 산업용 부품', r: 30, p: 27, c: 'bg-emerald-500', note: '유럽·아시아 같은 제품.' },
    { n: '항공 부품', r: 30, p: 33, c: 'bg-sky-500', note: '항공기 연료·유압·제동 부품. 교체 수요가 많다.' },
  ] },
  // ── B등급 ──
  ARES: { basis: '2025년 사업 보고서', rows: [
    { n: '사모 대출', r: 62, p: 62, c: 'bg-blue-700', note: '은행 대신 중견기업에 직접 돈을 빌려주는 펀드. 운용 수수료가 주 수입.' },
    { n: '부동산·인프라', r: 20, p: 18, c: 'bg-amber-600', note: '부동산·인프라 펀드.' },
    { n: '사모펀드·기타', r: 18, p: 20, c: 'bg-gray-500', note: '기업 인수 펀드, 보험 자산 운용.' },
  ] },
  APO: { basis: '2025년 사업 보고서', rows: [
    { n: '보험 자산(애슬린)', r: 70, p: 55, c: 'bg-blue-700', note: '자회사 애슬린이 연금 보험을 팔고 받은 돈을 굴려 이자 차익을 남긴다.' },
    { n: '자산 운용 수수료', r: 25, p: 38, c: 'bg-emerald-500', note: '사모 대출·사모펀드 운용 수수료.' },
    { n: '성과 보수·기타', r: 5, p: 7, c: 'bg-amber-500', note: '펀드 성과 보수.' },
  ] },
  KEYS: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '통신·반도체 계측', r: 66, p: 68, c: 'bg-blue-600', note: '5G·데이터센터 통신 장비 시험기, 반도체 설계 검증 소프트웨어.' },
    { n: '전자 산업 계측', r: 34, p: 32, c: 'bg-emerald-500', note: '자동차·전자 회사용 오실로스코프·전원 측정기.' },
  ] },
  PODD: { basis: '2025년 사업 보고서', rows: [
    { n: '인슐린 펌프(옴니팟) 미국', r: 70, c: 'bg-sky-500', u: [350, '달', '옴니팟 한 달 치(10개)'], note: '배에 붙이는 일회용 인슐린 펌프. 3일마다 갈아 끼운다.' },
    { n: '해외', r: 30, c: 'bg-emerald-500', note: '유럽 등.' },
  ] },
  HCA: { basis: '2025년 사업 보고서', rows: [
    { n: '입원', r: 45, p: 45, c: 'bg-red-600', u: [20000, '건', '입원 1건(평균)'], note: '미국 최대 병원 체인(약 190개 병원).' },
    { n: '외래·응급실', r: 40, p: 40, c: 'bg-blue-600', note: '응급실·외래 수술센터.' },
    { n: '기타', r: 15, p: 15, c: 'bg-gray-400', note: '의원·검사 등.' },
  ] },
  KKR: { basis: '2025년 사업 보고서', rows: [
    { n: '보험(글로벌 애틀랜틱)', r: 70, p: 35, c: 'bg-blue-700', note: '연금 보험을 팔아 받은 돈을 굴린다.' },
    { n: '자산 운용', r: 25, p: 50, c: 'bg-emerald-500', note: '사모펀드·인프라·사모 대출 운용 수수료와 성과 보수.' },
    { n: '자기 자본 투자', r: 5, p: 15, c: 'bg-gray-500', note: '회사 돈으로 직접 투자.' },
  ] },
  BR: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '투자자 통신(주총 안내문 발송)', r: 65, p: 60, c: 'bg-blue-600', u: [1.5, '통', '주주총회 안내문 1통 처리'], note: '미국 상장사 주총 안내문·의결권 처리를 거의 독점.' },
    { n: '증권 거래 처리 시스템', r: 35, p: 40, c: 'bg-emerald-500', note: '증권사 주식·채권 거래 처리 소프트웨어.' },
  ] },
  CBOE: { basis: '2025년 사업 보고서', rows: [
    { n: '옵션 거래(S&P500·VIX)', r: 60, p: 65, c: 'bg-blue-700', note: 'S&P500 지수 옵션(SPX)·변동성 지수(VIX)를 독점 상장.' },
    { n: '미국 주식 거래', r: 15, p: 12, c: 'bg-emerald-500', note: '주식 거래소.' },
    { n: '해외·선물·데이터', r: 25, p: 23, c: 'bg-gray-500', note: '유럽 주식, 선물, 시세 데이터.' },
  ] },
  XYL: { basis: '2025년 사업 보고서', rows: [
    { n: '수처리 펌프·장비', r: 40, p: 38, c: 'bg-blue-600', note: '하수 처리장 펌프·소독 장비.' },
    { n: '스마트 수도 계량기', r: 23, p: 22, c: 'bg-sky-400', note: '원격 검침 수도 계량기.' },
    { n: '수질 측정·처리 솔루션', r: 37, p: 40, c: 'bg-emerald-500', note: '수질 분석기, 정수 처리(이보쿠아).' },
  ] },
  URI: { basis: '2025년 사업 보고서', rows: [
    { n: '일반 장비 대여', r: 65, p: 60, c: 'bg-amber-500', note: '굴착기·고소 작업대·지게차 대여. 미국 1위.' },
    { n: '특수 장비 대여', r: 35, p: 40, c: 'bg-blue-600', note: '임시 전원·냉방·배수 펌프·안전 장비. 이익률이 더 높다.' },
  ] },
  GDDY: { basis: '2025년 사업 보고서', rows: [
    { n: '웹사이트·결제·마케팅 도구', r: 32, p: 40, c: 'bg-emerald-500', note: '홈페이지 제작, 온라인 결제, 이메일.' },
    { n: '도메인·호스팅·보안', r: 68, p: 60, c: 'bg-gray-700', u: [22, '개', '.com 도메인 1년'], note: '세계 최대 도메인 등록 회사. 해마다 갱신하는 반복 매출.' },
  ] },
  AJG: { basis: '2025년 사업 보고서', rows: [
    { n: '보험 중개', r: 80, p: 85, c: 'bg-blue-700', note: '기업 보험 중개. 인수(어슈어드파트너스)로 커졌다.' },
    { n: '보험금 처리 대행·위험 관리', r: 20, p: 15, c: 'bg-emerald-500', note: '보험사·기업 대신 보험금 청구 처리.' },
  ] },
  CINF: { basis: '2025년 사업 보고서', rows: [
    { n: '기업 보험', r: 45, p: 40, c: 'bg-red-700', note: '중소기업 재산·배상책임 보험. 지역 독립 대리점을 통해 판다.' },
    { n: '개인 보험(주택·자동차)', r: 30, p: 15, c: 'bg-amber-500', note: '자연재해에 민감.' },
    { n: '초과·특수 보험', r: 10, p: 10, c: 'bg-blue-600', note: '일반 보험이 받지 않는 위험.' },
    { n: '투자 수익', r: 15, p: 35, c: 'bg-emerald-500', note: '보유 주식(약 100억 달러)·채권에서 나오는 배당·이자. 주가 변동도 이익에 잡힌다.' },
  ] },
  ULTA: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '화장품', r: 50, p: 50, c: 'bg-pink-500', u: [25, '개', '화장품 한 개(평균)'], note: '마트용부터 명품까지 한곳에 파는 미국 최대 화장품 매장.' },
    { n: '헤어·스킨케어·향수', r: 45, p: 42, c: 'bg-violet-500', note: '샴푸·스킨케어·향수.' },
    { n: '미용실 서비스', r: 5, p: 8, c: 'bg-amber-500', note: '매장 안 미용실.' },
  ] },
  TEL: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '자동차 커넥터·센서', r: 55, p: 52, c: 'bg-gray-600', note: '자동차 배선 커넥터. 전기차 한 대에 더 많이 들어간다.' },
    { n: '산업·데이터센터 커넥터', r: 45, p: 48, c: 'bg-blue-600', note: 'AI 서버 고속 커넥터, 공장·항공·의료 부품.' },
  ] },
  EQIX: { basis: '2025년 사업 보고서', rows: [
    { n: '미주 데이터센터', r: 45, p: 42, c: 'bg-red-600', note: '서버 자리를 빌려주고 회사끼리 바로 연결해 주는 데이터센터. 연결료가 핵심.' },
    { n: '유럽·중동·아프리카', r: 32, p: 33, c: 'bg-blue-600', note: '같은 사업.' },
    { n: '아시아·태평양', r: 23, p: 25, c: 'bg-emerald-500', note: '같은 사업.' },
  ] },
  PTC: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '설계 소프트웨어(CAD: 크레오·온쉐이프)', r: 40, p: 40, c: 'bg-blue-600', note: '공장 기계·부품을 3D로 설계하는 소프트웨어.' },
    { n: '제품 수명 관리(PLM: 윈칠·코드비머)', r: 60, p: 60, c: 'bg-emerald-500', note: '부품 목록·설계 변경·생산 정보를 관리하는 소프트웨어.' },
  ] },
  ELV: { basis: '2025년 사업 보고서', rows: [
    { n: '건강보험(블루크로스)', r: 75, p: 55, c: 'bg-blue-700', note: '14개 주 블루크로스 블루실드 보험. 정부 보험(메디케이드) 의료비 증가로 이익 감소.' },
    { n: '카렐론(약국·의료 서비스)', r: 25, p: 45, c: 'bg-emerald-500', note: '약제비 관리, 재택 의료, 행동 건강.' },
  ] },
  ADSK: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '건축·토목 설계(AEC)', r: 50, p: 52, c: 'bg-blue-600', note: '레빗·오토캐드 건축용. 건물·도로 설계.' },
    { n: '오토캐드', r: 25, p: 27, c: 'bg-red-600', u: [255, '달', '오토캐드 한 달 구독'], note: '2D·3D 설계 프로그램.' },
    { n: '제조 설계', r: 18, p: 15, c: 'bg-gray-500', note: '퓨전·인벤터.' },
    { n: '영화·게임(마야·3ds 맥스)', r: 7, p: 6, c: 'bg-violet-500', note: '3D 애니메이션.' },
  ] },
  ADI: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '산업용 칩', r: 45, p: 50, c: 'bg-blue-700', note: '공장 자동화·계측·항공 방산용 아날로그 칩. 이익률이 가장 높다.' },
    { n: '자동차 칩', r: 30, p: 25, c: 'bg-gray-600', note: '배터리 관리·차량 오디오·센서 칩.' },
    { n: '통신 칩', r: 12, p: 13, c: 'bg-emerald-500', note: '기지국·데이터센터 칩.' },
    { n: '가전 칩', r: 13, p: 12, c: 'bg-amber-500', note: '휴대폰·웨어러블 칩.' },
  ] },
  DECK: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '호카(러닝화)', r: 47, p: 48, c: 'bg-sky-500', u: [150, '켤레', '호카 러닝화'], note: '두꺼운 쿠션 러닝화. 빠르게 성장.' },
    { n: '어그(양털 부츠)', r: 47, p: 48, c: 'bg-amber-700', u: [180, '켤레', '어그 부츠'], note: '겨울 매출이 크다(10~12월).' },
    { n: '기타(테바 등)', r: 6, p: 4, c: 'bg-gray-400', note: '테바 샌들.' },
  ] },
  GD: { basis: '2025년 사업 보고서', rows: [
    { n: '걸프스트림 비즈니스 제트기', r: 27, p: 28, c: 'bg-sky-500', u: [75000000, '대', '걸프스트림 G700'], note: '부자·기업용 비즈니스 제트기.' },
    { n: '해군 함정(핵잠수함·구축함)', r: 30, p: 22, c: 'bg-blue-800', note: '버지니아급·컬럼비아급 핵잠수함.' },
    { n: '전투 차량(탱크·포탄)', r: 18, p: 20, c: 'bg-gray-700', note: '에이브럼스 탱크·장갑차·포탄.' },
    { n: '정부 IT', r: 25, p: 30, c: 'bg-emerald-500', note: '국방·정보기관 IT 서비스.' },
  ] },
  ALLE: { basis: '2025년 사업 보고서', rows: [
    { n: '미주 도어락·출입 통제', r: 75, p: 85, c: 'bg-blue-600', note: '학교·병원·사무실 문 자물쇠, 도어 클로저, 전자 출입 장치(슐라게).' },
    { n: '해외', r: 25, p: 15, c: 'bg-emerald-500', note: '유럽·아시아 도어락.' },
  ] },
  WDAY: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '구독(인사·재무 소프트웨어)', r: 92, p: 100, c: 'bg-amber-500', note: '대기업 인사·급여·재무 관리 클라우드 소프트웨어.' },
    { n: '도입 컨설팅', r: 8, p: 0, c: 'bg-gray-400', note: '설치·교육 서비스. 거의 남지 않는다.' },
  ] },
  CAT: { basis: '2025년 사업 보고서', rows: [
    { n: '건설 장비', r: 38, p: 35, c: 'bg-yellow-500', u: [250000, '대', '굴착기'], note: '굴착기·불도저·로더.' },
    { n: '광산 장비', r: 20, p: 22, c: 'bg-amber-700', note: '대형 덤프트럭·광산용 장비.' },
    { n: '에너지·운송(발전기·엔진·기관차)', r: 37, p: 37, c: 'bg-blue-700', note: '데이터센터 발전기, 가스 터빈(솔라), 선박 엔진. AI 투자로 급성장.' },
    { n: '장비 할부 금융', r: 5, p: 6, c: 'bg-emerald-500', note: '장비 구입 대출.' },
  ] },
  ORCL: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '클라우드 서비스·라이선스 유지보수', r: 75, p: 80, c: 'bg-red-600', note: '오라클 데이터베이스 유지보수, 클라우드 인프라(OCI). AI 회사들과 대형 데이터센터 계약.' },
    { n: '소프트웨어 라이선스', r: 12, p: 15, c: 'bg-gray-600', note: '한 번 사는 라이선스.' },
    { n: '하드웨어', r: 6, p: 3, c: 'bg-gray-400', note: '서버(엑사데이터).' },
    { n: '컨설팅', r: 7, p: 2, c: 'bg-gray-300', note: '도입 서비스.' },
  ], how: '데이터센터 건설 투자가 커서 잉여현금흐름은 마이너스다.' },
  PLD: { basis: '2025년 사업 보고서', rows: [
    { n: '물류창고 임대', r: 92, p: 85, c: 'bg-orange-500', u: [10, '제곱피트', '창고 1제곱피트 1년 임대료'], note: '세계 최대 물류창고 회사. 아마존·월마트 등에 창고 임대.' },
    { n: '개발·운용 수수료', r: 8, p: 15, c: 'bg-gray-500', note: '창고를 지어 팔거나 펀드 운용 수수료.' },
  ] },
  AMGN: { basis: '2025년 사업 보고서', rows: [
    { n: '일반 의약품(골다공증·콜레스테롤·심장)', r: 45, p: 45, c: 'bg-blue-600', note: '프롤리아·레파타·이베니티.' },
    { n: '염증·면역(엔브렐·오테즐라·테즈스파이어)', r: 22, p: 22, c: 'bg-emerald-500', note: '관절염·건선·천식 약.' },
    { n: '항암제', r: 18, p: 18, c: 'bg-red-500', note: '블린사이토·이뮬직 등.' },
    { n: '희귀 질환(호라이즌 인수)', r: 15, p: 15, c: 'bg-violet-500', note: '테페자(갑상선 눈병) 등.' },
  ] },
  WTW: { basis: '2025년 사업 보고서', rows: [
    { n: '보험 중개·위험 관리', r: 45, p: 45, c: 'bg-blue-700', note: '기업 보험 중개.' },
    { n: '인사·보상·퇴직연금 컨설팅', r: 55, p: 55, c: 'bg-emerald-500', note: '연금·급여 체계 설계 컨설팅.' },
  ] },
  HSY: { basis: '2025년 사업 보고서', rows: [
    { n: '북미 초콜릿·사탕', r: 82, p: 88, c: 'bg-amber-800', u: [2, '개', '허쉬 초콜릿바'], note: '허쉬·리스 피넛버터컵·킷캣(미국). 카카오 값 폭등으로 이익 감소.' },
    { n: '북미 짭짤한 과자', r: 10, p: 7, c: 'bg-orange-500', note: '스키니팝 팝콘, 덕스 프레첼.' },
    { n: '해외', r: 8, p: 5, c: 'bg-emerald-500', note: '멕시코·브라질 등.' },
  ] },
  SYY: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '미국 식당 식자재 유통', r: 70, p: 80, c: 'bg-blue-700', note: '식당·학교·병원에 식자재 배달. 매출 대비 4% 남짓 남는다.' },
    { n: '해외', r: 18, p: 12, c: 'bg-emerald-500', note: '유럽·캐나다.' },
    { n: '고급 식재료·기타(SYGMA)', r: 12, p: 8, c: 'bg-gray-500', note: '체인 식당 전용 배송.' },
  ] },
  LH: { basis: '2025년 사업 보고서', rows: [
    { n: '진단 검사(혈액 검사 등)', r: 78, p: 78, c: 'bg-blue-600', u: [40, '건', '혈액 검사 1건'], note: '병원·의원이 맡기는 검사. 하루 수십만 건.' },
    { n: '제약 임상 검사', r: 22, p: 22, c: 'bg-emerald-500', note: '신약 임상시험 검사.' },
  ] },
  AFL: { basis: '2025년 사업 보고서', rows: [
    { n: '일본 보험', r: 60, p: 65, c: 'bg-red-600', note: '일본 암보험·의료보험 1위. 엔화 약세면 달러 이익이 줄어든다.' },
    { n: '미국 보험', r: 33, p: 30, c: 'bg-blue-600', note: '직장 부가 보험(다치면 현금 지급).' },
    { n: '기타', r: 7, p: 5, c: 'bg-gray-400', note: '투자 수익 등.' },
  ] },
  EXPD: { basis: '2025년 사업 보고서', rows: [
    { n: '항공 화물 주선', r: 35, p: 40, c: 'bg-sky-500', note: '화주 대신 비행기 화물칸을 잡아 준다.' },
    { n: '해상 화물 주선', r: 25, p: 25, c: 'bg-blue-700', note: '컨테이너 자리를 잡아 준다.' },
    { n: '통관·물류 서비스', r: 40, p: 35, c: 'bg-gray-500', note: '세관 신고·창고.' },
  ] },
  CPAY: { basis: '2025년 사업 보고서', rows: [
    { n: '기업 지출 결제', r: 50, p: 50, c: 'bg-blue-700', note: '기업 간 송금·해외 송금·거래처 결제.' },
    { n: '차량 연료 카드', r: 35, p: 35, c: 'bg-amber-500', note: '트럭 회사 주유 카드.' },
    { n: '숙박·기타', r: 15, p: 15, c: 'bg-gray-400', note: '항공사 승무원 숙박 결제 등.' },
  ] },
  EMR: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '공정 제어(밸브·계측·제어 시스템)', r: 62, p: 60, c: 'bg-blue-700', note: '화학·정유·제약 공장 제어 시스템.' },
    { n: '설계·시험 소프트웨어(아스펜·NI)', r: 28, p: 32, c: 'bg-violet-500', note: '공장 설계 소프트웨어, 전자 시험 장비.' },
    { n: '기타 산업 부품', r: 10, p: 8, c: 'bg-gray-400', note: '공구 등.' },
  ] },
  RCL: { basis: '2025년 사업 보고서', rows: [
    { n: '크루즈 승선료', r: 68, p: 62, c: 'bg-blue-600', u: [1500, '명', '크루즈 1인 요금(평균)'], note: '로열캐리비안·셀러브리티·실버시. 세계 최대 크루즈선 보유.' },
    { n: '선상 소비', r: 32, p: 38, c: 'bg-amber-500', note: '술·카지노·인터넷·기항지 관광.' },
  ] },
  CI: { basis: '2025년 사업 보고서', rows: [
    { n: '약제비 관리·전문 약국(에버노스)', r: 80, p: 60, c: 'bg-blue-700', note: '익스프레스 스크립츠(약값 협상·우편 약국), 특수 약 유통.' },
    { n: '직장 건강보험(시그나 헬스케어)', r: 20, p: 40, c: 'bg-emerald-500', note: '대기업 직원 건강보험.' },
  ] },
  PNR: { basis: '2025년 사업 보고서', rows: [
    { n: '수영장 장비', r: 35, p: 40, c: 'bg-sky-500', note: '수영장 펌프·필터·히터. 미국 1위.' },
    { n: '물 처리·정수', r: 25, p: 25, c: 'bg-blue-600', note: '정수기·연수기.' },
    { n: '유체 이송(펌프)', r: 40, p: 35, c: 'bg-gray-500', note: '가정·농업용 펌프.' },
  ] },
  CSCO: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '네트워크 장비', r: 52, p: 45, c: 'bg-blue-700', note: '스위치·라우터·무선 장비. AI 데이터센터 주문 증가.' },
    { n: '보안', r: 15, p: 15, c: 'bg-red-600', note: '방화벽, 스플렁크 보안 분석.' },
    { n: '협업(웹엑스)', r: 7, p: 8, c: 'bg-emerald-500', note: '화상회의·전화.' },
    { n: '관측(스플렁크·앱다이내믹스)', r: 5, p: 5, c: 'bg-violet-500', note: '시스템 감시 소프트웨어.' },
    { n: '유지보수 서비스', r: 21, p: 27, c: 'bg-gray-500', note: '설치된 장비의 기술 지원 계약.' },
  ] },
  AMAT: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '반도체 장비', r: 75, p: 80, c: 'bg-blue-700', note: '웨이퍼에 막을 입히고(증착) 깎는(식각) 장비. 세계 1위 반도체 장비 회사.' },
    { n: '정비·부품(어플라이드 글로벌 서비스)', r: 22, p: 18, c: 'bg-emerald-500', note: '설치 장비 정비 계약.' },
    { n: '디스플레이 장비', r: 3, p: 2, c: 'bg-gray-400', note: 'OLED 장비.' },
  ] },
  BNY: { basis: '2025년 사업 보고서', rows: [
    { n: '증권 보관·관리', r: 45, p: 45, c: 'bg-blue-700', note: '연기금·펀드의 주식·채권을 맡아 보관하고 결제(세계 최대 수탁 은행).' },
    { n: '시장·결제 서비스', r: 33, p: 37, c: 'bg-emerald-500', note: '국채 결제(퍼싱), 외환·송금.' },
    { n: '자산·자산관리', r: 22, p: 18, c: 'bg-gray-500', note: '펀드 운용·부자 고객 관리.' },
  ] },
  KR: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '식료품', r: 72, p: 80, c: 'bg-blue-600', u: [60, '번', '장보기 1회(평균)'], note: '미국 최대 슈퍼마켓 체인(약 2,700개).' },
    { n: '주유소', r: 12, p: 5, c: 'bg-gray-600', note: '마트 주유소.' },
    { n: '약국', r: 16, p: 15, c: 'bg-emerald-500', note: '마트 안 약국.' },
  ] },
  GS: { basis: '2025년 사업 보고서', rows: [
    { n: '투자은행·트레이딩', r: 68, p: 72, c: 'bg-blue-800', note: '기업 인수합병 자문, 주식·채권 트레이딩. 증시가 바쁘면 크게 번다.' },
    { n: '자산·자산관리', r: 28, p: 25, c: 'bg-emerald-500', note: '부자 고객 관리, 펀드 운용.' },
    { n: '플랫폼(카드 등)', r: 4, p: 3, c: 'bg-gray-400', note: '애플카드(정리 중).' },
  ] },
  AVY: { basis: '2025년 사업 보고서', rows: [
    { n: '라벨 소재', r: 66, p: 65, c: 'bg-gray-600', note: '음료병·택배 상자 스티커 소재.' },
    { n: '옷 태그·RFID 칩', r: 34, p: 35, c: 'bg-blue-600', note: '옷 가격표, 무선 인식(RFID) 태그.' },
  ] },
  SPG: { basis: '2025년 사업 보고서', rows: [
    { n: '쇼핑몰·아울렛 임대', r: 90, p: 92, c: 'bg-blue-700', note: '미국 최대 쇼핑몰·프리미엄 아울렛 회사.' },
    { n: '기타(지분 투자 등)', r: 10, p: 8, c: 'bg-gray-400', note: '유통 브랜드 지분 등.' },
  ] },
  WMB: { basis: '2025년 사업 보고서', rows: [
    { n: '가스관 운송(트랜스코)', r: 50, p: 55, c: 'bg-blue-700', note: '텍사스에서 뉴욕까지 이어지는 미국 최대 천연가스관. 운송료가 고정이라 안정적.' },
    { n: '가스 수집·처리', r: 35, p: 35, c: 'bg-gray-600', note: '가스전에서 가스를 모아 처리.' },
    { n: '가스 판매·기타', r: 15, p: 10, c: 'bg-amber-500', note: '가스 거래.' },
  ] },
  MS: { basis: '2025년 사업 보고서', rows: [
    { n: '자산관리', r: 45, p: 45, c: 'bg-blue-700', note: '부자 고객·직장인 주식 보상 계좌(이트레이드). 안정적인 수수료.' },
    { n: '투자은행·트레이딩', r: 45, p: 43, c: 'bg-gray-700', note: '인수합병 자문, 주식 트레이딩.' },
    { n: '펀드 운용', r: 10, p: 12, c: 'bg-emerald-500', note: '모건스탠리 자산운용.' },
  ] },
  HIG: { basis: '2025년 사업 보고서', rows: [
    { n: '기업 보험', r: 55, p: 60, c: 'bg-red-700', note: '중소기업 산재·재산·배상책임 보험.' },
    { n: '단체 복지 보험', r: 25, p: 20, c: 'bg-blue-600', note: '직장 장애·생명 보험.' },
    { n: '개인 보험', r: 15, p: 8, c: 'bg-amber-500', note: 'AARP 회원 자동차·주택 보험.' },
    { n: '펀드 운용', r: 5, p: 12, c: 'bg-emerald-500', note: '하트퍼드 펀드.' },
  ] },
  RL: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '북미', r: 40, p: 35, c: 'bg-blue-800', u: [100, '벌', '폴로 셔츠'], note: '폴로 셔츠·셔츠·재킷.' },
    { n: '유럽', r: 30, p: 35, c: 'bg-emerald-500', note: '유럽 매장·백화점.' },
    { n: '아시아', r: 30, p: 30, c: 'bg-red-500', note: '중국·일본·한국. 빠르게 성장.' },
  ] },
  TPR: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '코치', r: 80, p: 92, c: 'bg-amber-700', u: [350, '개', '코치 태비 가방'], note: '태비 가방이 젊은 층에서 인기.' },
    { n: '케이트 스페이드', r: 17, p: 8, c: 'bg-pink-400', note: '부진. 매각 검토.' },
    { n: '스튜어트 와이츠먼', r: 3, p: 0, c: 'bg-gray-400', note: '신발(매각).' },
  ] },
  AMD: { basis: '2025년 사업 보고서', rows: [
    { n: '데이터센터(AI 칩·서버 CPU)', r: 50, p: 60, c: 'bg-red-600', note: 'AI 가속기 MI350·MI400, 서버 칩 에픽. 오픈AI와 대형 계약.' },
    { n: 'PC 칩(라이젠)', r: 28, p: 25, c: 'bg-gray-700', note: '노트북·데스크톱 CPU·그래픽카드.' },
    { n: '게임기 칩', r: 10, p: 5, c: 'bg-blue-600', note: '플레이스테이션·엑스박스 칩.' },
    { n: '임베디드(자일링스)', r: 12, p: 10, c: 'bg-emerald-500', note: '통신·자동차·산업용 칩.' },
  ], how: '자일링스 인수 상각 때문에 장부상 이익이 실제보다 작게 나온다.' },
  // ── C등급 (1) ──
  LITE: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '광통신 부품', r: 85, p: 92, c: 'bg-violet-600', note: 'AI 데이터센터 서버를 빛으로 잇는 레이저·광 트랜시버. 급성장.' },
    { n: '산업용 레이저', r: 15, p: 8, c: 'bg-gray-500', note: '3D 센싱·산업용 레이저.' },
  ] },
  MPC: { basis: '2025년 사업 보고서', rows: [
    { n: '정유·판매', r: 92, p: 55, c: 'bg-red-700', u: [3, '갤런', '휘발유 1갤런'], note: '미국 최대 정유 회사. 정제 마진에 따라 이익이 크게 출렁인다.' },
    { n: '송유관(MPLX)', r: 8, p: 45, c: 'bg-blue-600', note: '송유관·가스 처리 자회사. 운송료가 안정적.' },
  ] },
  LULU: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '미국', r: 58, p: 55, c: 'bg-red-600', u: [118, '벌', '얼라인 레깅스'], note: '요가복·운동복. 미국 판매가 줄고 있다.' },
    { n: '캐나다', r: 12, p: 13, c: 'bg-gray-500', note: '본사 국가.' },
    { n: '중국·해외', r: 30, p: 32, c: 'bg-emerald-500', note: '중국 판매 +20% 안팎으로 성장.' },
  ] },
  ROK: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '공장 제어 장치(PLC)', r: 45, p: 50, c: 'bg-red-600', note: '공장 기계를 제어하는 컴퓨터(앨런브래들리).' },
    { n: '모터·구동 장치', r: 30, p: 25, c: 'bg-gray-500', note: '모터 속도 제어기.' },
    { n: '공장 소프트웨어·서비스', r: 25, p: 25, c: 'bg-blue-600', note: '생산 관리 소프트웨어, 유지보수.' },
  ] },
  CDW: { basis: '2025년 사업 보고서', rows: [
    { n: '기업 IT 유통', r: 50, p: 50, c: 'bg-red-600', note: '기업에 노트북·서버·소프트웨어를 대신 사서 설치해 준다.' },
    { n: '공공(정부·학교·병원)', r: 35, p: 35, c: 'bg-blue-600', note: '공공기관 IT 구매 대행.' },
    { n: '해외(영국·캐나다)', r: 15, p: 15, c: 'bg-gray-500', note: '해외 법인.' },
  ] },
  HPE: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '서버', r: 50, p: 35, c: 'bg-emerald-600', note: 'AI 서버 포함. 매출은 크지만 이익률이 낮다.' },
    { n: '네트워크(아루바·주니퍼)', r: 30, p: 50, c: 'bg-blue-600', note: '무선·데이터센터 네트워크. 주니퍼 인수로 커졌다.' },
    { n: '하이브리드 클라우드·기타', r: 20, p: 15, c: 'bg-gray-500', note: '저장장치, 구독형 IT(그린레이크).' },
  ] },
  ATO: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '가스 공급(8개 주)', r: 85, p: 70, c: 'bg-blue-600', u: [70, '달', '가정 한 달 가스 요금'], note: '텍사스 등 약 340만 가구 가스 공급. 요금은 정부가 정한다.' },
    { n: '가스관·저장', r: 15, p: 30, c: 'bg-gray-600', note: '텍사스 가스관.' },
  ] },
  MCHP: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '마이크로컨트롤러', r: 52, p: 55, c: 'bg-red-600', note: '가전·자동차·공장 기계를 제어하는 작은 칩.' },
    { n: '아날로그 칩', r: 28, p: 28, c: 'bg-blue-600', note: '전원·신호 칩.' },
    { n: '기타(FPGA·메모리 등)', r: 20, p: 17, c: 'bg-gray-500', note: '프로그래밍 가능한 칩 등.' },
  ] },
  AIZ: { basis: '2025년 사업 보고서', rows: [
    { n: '전자제품·자동차 보증 보험', r: 60, p: 55, c: 'bg-blue-600', note: '휴대폰 파손 보험, 자동차 연장 보증.' },
    { n: '주택 보험(대출 연계)', r: 40, p: 45, c: 'bg-amber-500', note: '세입자 보험, 대출 연계 주택 보험.' },
  ] },
  VLO: { basis: '2025년 사업 보고서', rows: [
    { n: '정유', r: 92, p: 85, c: 'bg-red-700', u: [3, '갤런', '휘발유 1갤런'], note: '세계 최대 독립 정유 회사. 정제 마진에 따라 이익이 크게 출렁인다.' },
    { n: '바이오 연료(에탄올·재생 디젤)', r: 8, p: 15, c: 'bg-green-600', note: '옥수수 에탄올, 폐식용유 디젤.' },
  ] },
  SYF: { basis: '2025년 사업 보고서', rows: [
    { n: '유통사 제휴 카드 이자', r: 85, p: 85, c: 'bg-amber-500', note: '아마존·로우스·페이팔 등 매장 신용카드 대출 이자.' },
    { n: '수수료 등', r: 15, p: 15, c: 'bg-gray-400', note: '연체료 등.' },
  ], how: '카드 대출 연체가 늘면 이익이 크게 준다.' },
  PNC: { basis: '2025년 사업 보고서', rows: [
    { n: '대출·예금 이자', r: 64, p: 60, c: 'bg-blue-700', note: '미국 7위권 은행. 대출 이자에서 예금 이자를 뺀 차익.' },
    { n: '수수료(자산관리·카드·기업)', r: 36, p: 40, c: 'bg-emerald-500', note: '자산관리·카드·기업 자금 관리 수수료.' },
  ] },
  ALL: { basis: '2025년 사업 보고서', rows: [
    { n: '자동차 보험', r: 65, p: 55, c: 'bg-blue-600', note: '미국 4위 자동차 보험.' },
    { n: '주택 보험', r: 22, p: 25, c: 'bg-amber-500', note: '자연재해에 민감.' },
    { n: '보증·기타 보험', r: 13, p: 20, c: 'bg-emerald-500', note: '전자제품 보증, 직장 보험.' },
  ] },
  NI: { basis: '2025년 사업 보고서', rows: [
    { n: '가스 공급', r: 60, p: 50, c: 'bg-blue-600', note: '인디애나·오하이오 등 가스 공급.' },
    { n: '전기 공급', r: 40, p: 50, c: 'bg-amber-500', note: '인디애나 북부 전기.' },
  ] },
  GNRC: { basis: '2025년 사업 보고서', rows: [
    { n: '가정용 비상 발전기', r: 55, p: 65, c: 'bg-amber-500', u: [5000, '대', '가정용 비상 발전기'], note: '정전 때 자동으로 켜지는 집 발전기. 허리케인·정전 많으면 잘 팔린다.' },
    { n: '상업·데이터센터 발전기', r: 35, p: 30, c: 'bg-gray-600', note: '데이터센터 비상 발전기로 확장 중.' },
    { n: '기타', r: 10, p: 5, c: 'bg-gray-400', note: '정원 장비 등.' },
  ] },
  CFG: { basis: '2025년 사업 보고서', rows: [
    { n: '개인 은행', r: 60, p: 55, c: 'bg-emerald-600', note: '미국 동북부 지점, 예금·주택 대출.' },
    { n: '기업 은행', r: 40, p: 45, c: 'bg-blue-700', note: '중견기업 대출·자문.' },
  ] },
  FANG: { basis: '2025년 사업 보고서', rows: [
    { n: '원유', r: 80, p: 85, c: 'bg-gray-800', u: [65, '배럴', '원유 1배럴'], note: '텍사스 퍼미안 분지 셰일 원유.' },
    { n: '천연가스·가스액', r: 20, p: 15, c: 'bg-blue-500', note: '같이 나오는 가스.' },
  ] },
  NXPI: { basis: '2025년 사업 보고서', rows: [
    { n: '자동차 칩', r: 57, p: 58, c: 'bg-gray-700', note: '차량 레이더·제어·통신 칩. 세계 1위권.' },
    { n: '산업·사물인터넷', r: 18, p: 18, c: 'bg-blue-600', note: '공장·가전 칩.' },
    { n: '휴대폰(NFC 결제 칩)', r: 12, p: 12, c: 'bg-emerald-500', note: '휴대폰 결제용 근거리 통신 칩.' },
    { n: '통신 인프라', r: 13, p: 12, c: 'bg-violet-500', note: '기지국 칩.' },
  ] },
  LNT: { basis: '2025년 사업 보고서', rows: [
    { n: '전기', r: 85, p: 88, c: 'bg-amber-500', note: '아이오와·위스콘신 전기 공급. 데이터센터 전력 수요 증가.' },
    { n: '가스', r: 15, p: 12, c: 'bg-blue-600', note: '가스 공급.' },
  ] },
  WEC: { basis: '2025년 사업 보고서', rows: [
    { n: '위스콘신 전기·가스', r: 75, p: 75, c: 'bg-amber-500', note: '위스콘신 약 470만 가구. 마이크로소프트 데이터센터 전력.' },
    { n: '일리노이·미네소타 가스', r: 20, p: 15, c: 'bg-blue-600', note: '시카고 가스(피플스 가스).' },
    { n: '전력 인프라 투자', r: 5, p: 10, c: 'bg-gray-500', note: '송전 회사 지분, 풍력.' },
  ] },
  XEL: { basis: '2025년 사업 보고서', rows: [
    { n: '전기', r: 82, p: 88, c: 'bg-amber-500', note: '미네소타·콜로라도·텍사스 등 8개 주 전기. 풍력 비중이 높다.' },
    { n: '가스', r: 18, p: 12, c: 'bg-blue-600', note: '가스 공급.' },
  ] },
  TECH: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '연구용 단백질·항체 시약', r: 72, p: 85, c: 'bg-emerald-600', note: '세포 연구에 쓰는 단백질·항체. 이익률이 매우 높다.' },
    { n: '진단·유전자 분석', r: 28, p: 15, c: 'bg-violet-500', note: '진단 시약, 단백질 분석 장비.' },
  ] },
  STLD: { basis: '2025년 사업 보고서', rows: [
    { n: '철강', r: 70, p: 75, c: 'bg-gray-600', u: [900, '톤', '열연 강판 1톤'], note: '고철을 전기로 녹여 만드는 철강. 원가가 낮다.' },
    { n: '고철 재활용', r: 12, p: 5, c: 'bg-amber-700', note: '고철 수집·판매.' },
    { n: '철골 구조물·알루미늄', r: 18, p: 20, c: 'bg-blue-600', note: '건물 철골, 새 알루미늄 공장.' },
  ] },
  DLR: { basis: '2025년 사업 보고서', rows: [
    { n: '대형 데이터센터 임대', r: 60, p: 60, c: 'bg-violet-600', note: '클라우드·AI 회사에 데이터센터 통째 임대.' },
    { n: '기업 서버 자리·연결', r: 32, p: 33, c: 'bg-blue-600', note: '기업 서버 자리 임대, 회사끼리 연결.' },
    { n: '기타', r: 8, p: 7, c: 'bg-gray-400', note: '전력 비용 정산 등.' },
  ] },
  AEE: { basis: '2025년 사업 보고서', rows: [
    { n: '미주리 전기', r: 60, p: 50, c: 'bg-amber-500', note: '세인트루이스 등 전기 공급.' },
    { n: '일리노이 전기·가스 배송', r: 30, p: 30, c: 'bg-blue-600', note: '일리노이 전력망.' },
    { n: '송전', r: 10, p: 20, c: 'bg-gray-600', note: '고압 송전망.' },
  ] },
  DTE: { basis: '2025년 사업 보고서', rows: [
    { n: '디트로이트 전기', r: 55, p: 70, c: 'bg-amber-500', note: '미시간 전기 공급.' },
    { n: '가스', r: 15, p: 20, c: 'bg-blue-600', note: '미시간 가스.' },
    { n: '에너지 거래·서비스', r: 30, p: 10, c: 'bg-gray-500', note: '전력·가스 거래, 산업체 에너지 설비.' },
  ] },
  GL: { basis: '2025년 사업 보고서', rows: [
    { n: '생명보험', r: 75, p: 75, c: 'bg-blue-600', note: '중산층 대상 소액 생명보험을 우편·대리점으로 판다.' },
    { n: '건강보험', r: 25, p: 25, c: 'bg-emerald-500', note: '노인 보충 의료보험.' },
  ] },
  CMS: { basis: '2025년 사업 보고서', rows: [
    { n: '미시간 전기', r: 65, p: 65, c: 'bg-amber-500', note: '미시간 약 190만 가구.' },
    { n: '미시간 가스', r: 30, p: 30, c: 'bg-blue-600', note: '약 180만 가구.' },
    { n: '발전 사업', r: 5, p: 5, c: 'bg-gray-500', note: '비규제 발전.' },
  ] },
  ON: { basis: '2025년 사업 보고서', rows: [
    { n: '전력 반도체(전기차·태양광)', r: 47, p: 45, c: 'bg-emerald-600', note: '전기차 인버터용 탄화규소 칩. 전기차 둔화로 부진.' },
    { n: '아날로그·혼합 신호', r: 37, p: 40, c: 'bg-blue-600', note: '전원 관리 칩.' },
    { n: '이미지 센서', r: 16, p: 15, c: 'bg-violet-500', note: '자동차 카메라 센서.' },
  ] },
  AEP: { basis: '2025년 사업 보고서', rows: [
    { n: '전기 공급(11개 주)', r: 70, p: 60, c: 'bg-amber-500', note: '오하이오·텍사스 등. 데이터센터 전력 수요 급증.' },
    { n: '송전', r: 15, p: 30, c: 'bg-gray-600', note: '미국 최대 고압 송전망.' },
    { n: '발전·기타', r: 15, p: 10, c: 'bg-gray-400', note: '비규제 발전.' },
  ] },
  PEG: { basis: '2025년 사업 보고서', rows: [
    { n: '뉴저지 전기·가스(PSE&G)', r: 70, p: 70, c: 'bg-amber-500', note: '뉴저지 약 230만 전기 고객.' },
    { n: '원자력 발전', r: 30, p: 30, c: 'bg-violet-500', note: '원전 3곳. 데이터센터 전력 계약 기대.' },
  ] },
  SRE: { basis: '2025년 사업 보고서', rows: [
    { n: '샌디에이고·남캘리포니아 가스', r: 55, p: 40, c: 'bg-blue-600', note: '캘리포니아 전기·가스.' },
    { n: '텍사스 전력망(온코)', r: 25, p: 40, c: 'bg-amber-500', note: '텍사스 최대 송배전망 지분.' },
    { n: 'LNG 수출·인프라', r: 20, p: 20, c: 'bg-gray-600', note: '멕시코·미국 LNG 터미널.' },
  ] },
  STX: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '데이터센터용 하드디스크', r: 80, p: 88, c: 'bg-emerald-600', u: [300, '개', '대용량 하드디스크'], note: '클라우드 회사 대용량 저장장치. AI 데이터 증가 수혜.' },
    { n: '개인·기타', r: 20, p: 12, c: 'bg-gray-500', note: '외장 하드·감시 카메라용.' },
  ] },
  ZBRA: { basis: '2025년 사업 보고서', rows: [
    { n: '바코드 스캐너·휴대 단말기', r: 65, p: 65, c: 'bg-gray-700', note: '창고·마트 직원이 쓰는 바코드 단말기.' },
    { n: '라벨 프린터·소모품', r: 35, p: 35, c: 'bg-blue-600', note: '택배 라벨 프린터, 라벨.' },
  ] },
  COO: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '콘택트렌즈', r: 66, p: 70, c: 'bg-sky-500', u: [30, '팩', '일회용 렌즈 한 팩'], note: '일회용 렌즈, 근시 진행 억제 렌즈(마이사이트).' },
    { n: '여성 건강(난임·출산)', r: 34, p: 30, c: 'bg-pink-500', note: '시험관 시술 재료, 자궁 기기.' },
  ] },
  HII: { basis: '2025년 사업 보고서', rows: [
    { n: '핵 항공모함·잠수함(뉴포트뉴스)', r: 50, p: 45, c: 'bg-blue-800', note: '미국 유일 핵 항공모함 조선소.' },
    { n: '구축함·상륙함(잉갈스)', r: 25, p: 30, c: 'bg-gray-600', note: '해군 구축함.' },
    { n: '기술 서비스', r: 25, p: 25, c: 'bg-emerald-500', note: '무인 잠수정, 국방 IT.' },
  ] },
  PFG: { basis: '2025년 사업 보고서', rows: [
    { n: '퇴직연금 관리', r: 45, p: 50, c: 'bg-blue-700', note: '중소기업 퇴직연금(401k) 관리.' },
    { n: '해외 연금·자산운용', r: 25, p: 30, c: 'bg-emerald-500', note: '중남미 연금, 펀드 운용.' },
    { n: '보험', r: 30, p: 20, c: 'bg-amber-500', note: '직장 보험·생명보험.' },
  ] },
  OKE: { basis: '2025년 사업 보고서', rows: [
    { n: '가스액(NGL) 처리·운송', r: 50, p: 50, c: 'bg-amber-500', note: '가스에서 프로판·부탄을 분리해 운송.' },
    { n: '가스 수집·처리', r: 25, p: 22, c: 'bg-gray-600', note: '가스전 수집.' },
    { n: '원유·정제품 송유관(마젤란)', r: 25, p: 28, c: 'bg-blue-600', note: '정제품 송유관.' },
  ] },
  PSX: { basis: '2025년 사업 보고서', rows: [
    { n: '정유·판매', r: 80, p: 40, c: 'bg-red-700', u: [3, '갤런', '휘발유 1갤런'], note: '정유 공장·주유소 브랜드(필립스66·76).' },
    { n: '송유관·가스 처리', r: 12, p: 45, c: 'bg-blue-600', note: '송유관·가스액 처리. 안정적.' },
    { n: '화학(CPChem 지분)', r: 8, p: 15, c: 'bg-gray-500', note: '셰브론과 합작한 석유화학.' },
  ] },
  EG: { basis: '2025년 사업 보고서', rows: [
    { n: '재보험', r: 65, p: 75, c: 'bg-blue-700', note: '보험사를 위한 보험. 자연재해가 많으면 손실.' },
    { n: '기업 보험', r: 35, p: 25, c: 'bg-gray-500', note: '기업 배상책임 보험(일부 정리).' },
  ] },
  NTRS: { basis: '2025년 사업 보고서', rows: [
    { n: '기관 자산 보관', r: 55, p: 50, c: 'bg-blue-700', note: '연기금·펀드 자산 보관·결제.' },
    { n: '부자 고객 자산관리', r: 45, p: 50, c: 'bg-emerald-500', note: '초부유층 가문 자산관리.' },
  ] },
  DGX: { basis: '2025년 사업 보고서', rows: [
    { n: '진단 검사', r: 97, p: 97, c: 'bg-emerald-600', u: [40, '건', '혈액 검사 1건'], note: '미국 최대 진단 검사 회사. 병원·의원 혈액·소변 검사.' },
    { n: '기타', r: 3, p: 3, c: 'bg-gray-400', note: '위험 평가 서비스 등.' },
  ] },
  FDX: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '택배(페덱스 익스프레스·그라운드)', r: 88, p: 85, c: 'bg-violet-700', u: [15, '개', '택배 1개(평균)'], note: '항공 특송·육상 택배. 하루 약 1,600만 개.' },
    { n: '화물 트럭(페덱스 프레이트)', r: 9, p: 15, c: 'bg-orange-500', note: '대형 화물 트럭(분사 예정).' },
    { n: '기타', r: 3, p: 0, c: 'bg-gray-400', note: '오피스 매장 등.' },
  ] },
  MAA: { basis: '2025년 사업 보고서', rows: [
    { n: '선벨트 아파트 임대', r: 100, c: 'bg-orange-500', u: [1650, '달', '아파트 한 달 월세'], note: '미국 남부·남동부 아파트 약 10만 가구. 새 아파트 공급이 많아 월세가 정체.' },
  ] },
  EXR: { basis: '2025년 사업 보고서', rows: [
    { n: '개인 창고 임대', r: 90, p: 92, c: 'bg-emerald-600', u: [170, '달', '창고 한 칸 한 달 임대료'], note: '미국 최대 개인 창고 회사(약 4,000곳).' },
    { n: '보험·관리 수수료', r: 10, p: 8, c: 'bg-gray-400', note: '맡긴 짐 보험, 다른 창고 관리 수수료.' },
  ] },
  CPT: { basis: '2025년 사업 보고서', rows: [
    { n: '선벨트 아파트 임대', r: 100, c: 'bg-orange-500', u: [2000, '달', '아파트 한 달 월세'], note: '텍사스·플로리다 등 아파트 약 6만 가구.' },
  ] },
  GLW: { basis: '2025년 사업 보고서', rows: [
    { n: '광섬유·케이블', r: 35, p: 40, c: 'bg-sky-500', note: 'AI 데이터센터 광케이블. 급성장.' },
    { n: '디스플레이 유리', r: 25, p: 30, c: 'bg-gray-500', note: 'TV·모니터 유리 기판.' },
    { n: '특수 유리(고릴라 글래스)', r: 15, p: 12, c: 'bg-blue-600', note: '휴대폰 화면 유리.' },
    { n: '자동차·태양광·기타', r: 25, p: 18, c: 'bg-amber-500', note: '배기가스 필터, 태양광 웨이퍼.' },
  ] },
  NWS: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '부동산 정보(리얼터닷컴·REA)', r: 20, p: 40, c: 'bg-emerald-500', note: '호주 부동산 1위 사이트 REA, 미국 리얼터닷컴.' },
    { n: '다우존스(월스트리트저널)', r: 25, p: 35, c: 'bg-blue-700', note: '월스트리트저널·배런스 구독, 금융 정보.' },
    { n: '신문(더타임스·뉴욕포스트 등)', r: 25, p: 10, c: 'bg-gray-500', note: '영국·호주 신문.' },
    { n: '출판(하퍼콜린스)', r: 20, p: 12, c: 'bg-amber-500', note: '책 출판.' },
    { n: '기타', r: 10, p: 3, c: 'bg-gray-400', note: '호주 유료 방송(매각) 등.' },
  ] },
  DUK: { basis: '2025년 사업 보고서', rows: [
    { n: '전기(캐롤라이나·플로리다 등)', r: 90, p: 90, c: 'bg-amber-500', note: '6개 주 약 860만 전기 고객. 원전 비중이 크다.' },
    { n: '가스', r: 10, p: 10, c: 'bg-blue-600', note: '가스 공급.' },
  ] },
  WELL: { basis: '2025년 사업 보고서', rows: [
    { n: '노인 주거 시설 운영', r: 75, p: 65, c: 'bg-emerald-600', note: '실버타운을 직접 운영해 입주비를 받는다. 고령화로 입주율 상승.' },
    { n: '노인 시설·병원 임대', r: 25, p: 35, c: 'bg-blue-600', note: '운영사에 건물을 장기 임대.' },
  ] },
  GEN: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '개인 보안(노턴·아바스트)', r: 70, p: 75, c: 'bg-amber-500', u: [60, '년', '노턴 1년 구독'], note: '백신·개인정보 보호 구독.' },
    { n: '개인 금융(머니라이언)', r: 30, p: 25, c: 'bg-emerald-500', note: '대출 비교 서비스.' },
  ] },
  TROW: { basis: '2025년 사업 보고서', rows: [
    { n: '뮤추얼펀드 운용 수수료', r: 85, p: 88, c: 'bg-blue-700', note: '은퇴 자금 펀드(타깃데이트). 저비용 ETF로 자금이 빠져나가는 중.' },
    { n: '기타 수수료', r: 15, p: 12, c: 'bg-gray-400', note: '관리·자문 수수료.' },
  ] },
  CRL: { basis: '2025년 사업 보고서', rows: [
    { n: '신약 동물 실험 대행', r: 60, p: 55, c: 'bg-blue-600', note: '신약 안전성 동물 시험. 제약사 연구 축소로 부진.' },
    { n: '실험용 동물 공급', r: 20, p: 25, c: 'bg-gray-500', note: '실험용 쥐 공급.' },
    { n: '제조 지원(품질 검사)', r: 20, p: 20, c: 'bg-emerald-500', note: '바이오 의약품 품질 검사.' },
  ] },
  PRU: { basis: '2025년 사업 보고서', rows: [
    { n: '미국 연금·생명보험', r: 45, p: 40, c: 'bg-blue-700', note: '퇴직연금 이전, 생명보험.' },
    { n: '해외(일본 등) 생명보험', r: 35, p: 45, c: 'bg-red-500', note: '일본 생명보험이 큰 몫.' },
    { n: '자산운용(PGIM)', r: 20, p: 15, c: 'bg-emerald-500', note: '펀드 운용.' },
  ] },
  CBRE: { basis: '2025년 사업 보고서', rows: [
    { n: '건물 관리·프로젝트', r: 70, p: 45, c: 'bg-gray-500', note: '기업 사무실·데이터센터 관리 대행.' },
    { n: '임대·매매 중개', r: 22, p: 45, c: 'bg-emerald-600', note: '상업용 부동산 중개. 경기 따라 출렁인다.' },
    { n: '부동산 투자·개발', r: 8, p: 10, c: 'bg-blue-600', note: '부동산 펀드·개발.' },
  ] },
  MTB: { basis: '2025년 사업 보고서', rows: [
    { n: '대출·예금 이자', r: 72, p: 70, c: 'bg-blue-700', note: '미국 동북부 지역 은행. 상업용 부동산 대출 비중이 크다.' },
    { n: '수수료', r: 28, p: 30, c: 'bg-emerald-500', note: '신탁·자산관리 수수료.' },
  ] },
  TRMB: { basis: '2025년 사업 보고서', rows: [
    { n: '건설·설계 소프트웨어', r: 55, p: 60, c: 'bg-blue-600', note: '건설 현장 설계·관리 소프트웨어(테클라·뷰포인트).' },
    { n: '현장 측량·위치 장비', r: 25, p: 25, c: 'bg-amber-500', note: 'GPS 측량 장비.' },
    { n: '운송 소프트웨어', r: 20, p: 15, c: 'bg-gray-500', note: '트럭 운송 관리.' },
  ] },
  CF: { basis: '2025년 사업 보고서', rows: [
    { n: '암모니아', r: 35, p: 40, c: 'bg-blue-600', note: '질소 비료 원료. 미국 싼 천연가스로 만든다.' },
    { n: '요소·질소 비료(UAN)', r: 50, p: 50, c: 'bg-emerald-500', note: '옥수수 밭 비료.' },
    { n: '기타(디젤 배기 정화액 등)', r: 15, p: 10, c: 'bg-gray-400', note: '트럭 요소수.' },
  ] },
  NWSA: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '부동산 정보(리얼터닷컴·REA)', r: 20, p: 40, c: 'bg-emerald-500', note: '호주 부동산 1위 사이트 REA, 미국 리얼터닷컴.' },
    { n: '다우존스(월스트리트저널)', r: 25, p: 35, c: 'bg-blue-700', note: '월스트리트저널 구독, 금융 정보.' },
    { n: '신문(더타임스·뉴욕포스트 등)', r: 25, p: 10, c: 'bg-gray-500', note: '영국·호주 신문.' },
    { n: '출판(하퍼콜린스)', r: 20, p: 12, c: 'bg-amber-500', note: '책 출판.' },
    { n: '기타', r: 10, p: 3, c: 'bg-gray-400', note: '기타.' },
  ] },
  SO: { basis: '2025년 사업 보고서', rows: [
    { n: '조지아·앨라배마 전기', r: 75, p: 80, c: 'bg-amber-500', note: '미국 남동부 전기. 보글 원전. 데이터센터 수요 급증.' },
    { n: '가스', r: 20, p: 15, c: 'bg-blue-600', note: '4개 주 가스 공급.' },
    { n: '도매 발전 등', r: 5, p: 5, c: 'bg-gray-500', note: '발전 판매.' },
  ] },
  COF: { basis: '2025년 사업 보고서', rows: [
    { n: '신용카드(디스커버 포함)', r: 65, p: 65, c: 'bg-red-600', note: '신용카드 대출 이자·수수료. 디스커버 인수로 자체 결제망도 가졌다.' },
    { n: '자동차 대출', r: 15, p: 15, c: 'bg-gray-500', note: '중고차 할부.' },
    { n: '예금·기업 은행', r: 20, p: 20, c: 'bg-blue-700', note: '온라인 예금, 기업 대출.' },
  ] },
  DHI: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '주택 건설·판매', r: 92, p: 88, c: 'bg-amber-700', u: [375000, '채', '새 집 한 채'], note: '미국 최대 주택 건설사. 1년에 약 9만 채.' },
    { n: '임대 주택·땅 개발(포레스타)', r: 6, p: 8, c: 'bg-emerald-500', note: '임대용 주택, 택지 개발.' },
    { n: '주택담보대출', r: 2, p: 4, c: 'bg-blue-600', note: '구매자 대출.' },
  ] },
  MO: { basis: '2025년 사업 보고서', rows: [
    { n: '담배(말보로)', r: 88, p: 88, c: 'bg-red-700', u: [10, '갑', '말보로 한 갑'], note: '미국 담배 시장 40% 넘게 차지. 판매량은 해마다 줄지만 값을 올린다.' },
    { n: '시가·씹는 담배', r: 10, p: 10, c: 'bg-amber-700', note: '코펜하겐 등.' },
    { n: '니코틴 파우치 등', r: 2, p: 2, c: 'bg-sky-400', note: '온!(on!) 파우치.' },
  ] },
  EBAY: { basis: '2025년 사업 보고서', rows: [
    { n: '거래 수수료', r: 85, p: 85, c: 'bg-blue-600', note: '판매자가 내는 수수료. 중고·수집품(카드·명품) 중심.' },
    { n: '광고 등', r: 15, p: 15, c: 'bg-amber-500', note: '판매자 광고.' },
  ] },
  ETR: { basis: '2025년 사업 보고서', rows: [
    { n: '전기(루이지애나·아칸소 등)', r: 95, p: 95, c: 'bg-amber-500', note: '미국 남부 4개 주 전기. 메타 데이터센터·LNG 공장 수요.' },
    { n: '가스 등', r: 5, p: 5, c: 'bg-blue-600', note: '가스 공급.' },
  ] },
  UHS: { basis: '2025년 사업 보고서', rows: [
    { n: '종합 병원', r: 55, p: 50, c: 'bg-red-600', note: '미국 종합 병원.' },
    { n: '정신 건강 병원', r: 45, p: 50, c: 'bg-violet-500', note: '미국 최대 정신과 병원 운영.' },
  ] },
  EXPE: { basis: '2025년 사업 보고서', rows: [
    { n: '숙박 예약', r: 75, p: 80, c: 'bg-blue-600', u: [30, '박', '호텔 1박 예약 수수료(평균)'], note: '익스피디아·호텔스닷컴·브르보(VRBO).' },
    { n: '항공·렌터카·기타', r: 13, p: 8, c: 'bg-gray-500', note: '항공권·렌터카.' },
    { n: '광고·기업 대상(B2B)', r: 12, p: 12, c: 'bg-emerald-500', note: '항공사·은행 앱에 예약 시스템 제공.' },
  ] },
  RVTY: { basis: '2025년 사업 보고서', rows: [
    { n: '생명과학 연구 시약·장비', r: 55, p: 55, c: 'bg-emerald-600', note: '세포·유전자 연구 도구.' },
    { n: '진단(신생아 검사 등)', r: 45, p: 45, c: 'bg-blue-600', note: '신생아 선별 검사, 면역 진단.' },
  ] },
  TRGP: { basis: '2025년 사업 보고서', rows: [
    { n: '가스 수집·처리(퍼미안)', r: 45, p: 45, c: 'bg-gray-600', note: '텍사스 셰일 가스 처리.' },
    { n: '가스액 운송·분리·수출', r: 55, p: 55, c: 'bg-amber-500', note: '프로판·부탄 분리, 수출 터미널.' },
  ] },
  MAS: { basis: '2025년 사업 보고서', rows: [
    { n: '수도꼭지·욕실(델타·한스그로에)', r: 65, p: 60, c: 'bg-blue-600', u: [200, '개', '델타 주방 수전'], note: '주방·욕실 수전, 샤워기.' },
    { n: '페인트·인테리어(베어)', r: 35, p: 40, c: 'bg-amber-500', note: '홈디포 전용 베어 페인트.' },
  ] },
  PNW: { basis: '2025년 사업 보고서', rows: [
    { n: '애리조나 전기(APS)', r: 100, c: 'bg-amber-500', note: '애리조나 약 140만 고객. 데이터센터·반도체 공장(TSMC) 전력 수요.' },
  ] },
  TGT: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '생활·식료품', r: 45, p: 40, c: 'bg-red-600', u: [60, '번', '장보기 1회(평균)'], note: '식품·세제·화장품. 자주 오게 하는 상품.' },
    { n: '의류·홈·가전', r: 45, p: 50, c: 'bg-gray-500', note: '의류·인테리어·장난감. 이익률이 높지만 소비 둔화로 부진.' },
    { n: '광고·기타', r: 10, p: 10, c: 'bg-emerald-500', note: '로운델 광고, 신용카드.' },
  ] },
  NUE: { basis: '2025년 사업 보고서', rows: [
    { n: '철강 공장', r: 55, p: 60, c: 'bg-gray-600', u: [900, '톤', '강판 1톤'], note: '미국 최대 철강사. 고철을 녹이는 전기로.' },
    { n: '철강 가공품(철골·문·창고 선반)', r: 35, p: 35, c: 'bg-blue-600', note: '건물 철골·데이터센터 구조물.' },
    { n: '원료(고철·철광석 대체재)', r: 10, p: 5, c: 'bg-amber-700', note: '고철 수집.' },
  ] },
  LEN: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '주택 건설·판매', r: 95, p: 90, c: 'bg-blue-700', u: [380000, '채', '새 집 한 채'], note: '미국 2위 주택 건설사. 가격을 깎아 판매량을 유지 중이라 이익률 하락.' },
    { n: '주택담보대출·기타', r: 5, p: 10, c: 'bg-emerald-500', note: '구매자 대출, 보험.' },
  ] },
  O: { basis: '2025년 사업 보고서', rows: [
    { n: '상가 건물 임대', r: 80, p: 80, c: 'bg-blue-600', note: '편의점·약국·달러샵 건물을 15~20년 장기 임대. 매달 배당.' },
    { n: '산업·기타 건물', r: 20, p: 20, c: 'bg-gray-500', note: '물류창고·카지노·데이터센터.' },
  ] },
  STT: { basis: '2025년 사업 보고서', rows: [
    { n: '자산 보관·서비스', r: 75, p: 70, c: 'bg-blue-700', note: '연기금·펀드 자산 보관·결제.' },
    { n: 'SPDR ETF 운용', r: 25, p: 30, c: 'bg-emerald-500', note: '세계 최초 ETF(SPY) 운용.' },
  ] },
  USB: { basis: '2025년 사업 보고서', rows: [
    { n: '대출·예금 이자', r: 60, p: 58, c: 'bg-blue-700', note: '미국 5위 은행.' },
    { n: '결제 서비스', r: 25, p: 27, c: 'bg-emerald-500', note: '카드·가맹점 결제(엘라본).' },
    { n: '신탁·기타 수수료', r: 15, p: 15, c: 'bg-gray-500', note: '신탁·자산관리.' },
  ] },
  MET: { basis: '2025년 사업 보고서', rows: [
    { n: '미국 단체 보험·연금', r: 45, p: 40, c: 'bg-blue-700', note: '직장 단체 생명·치과 보험, 퇴직연금 이전.' },
    { n: '아시아(일본 등)', r: 25, p: 30, c: 'bg-red-500', note: '일본 생명보험.' },
    { n: '중남미·유럽', r: 20, p: 18, c: 'bg-emerald-500', note: '멕시코·칠레 등.' },
    { n: '자산운용', r: 10, p: 12, c: 'bg-gray-500', note: '펀드 운용.' },
  ] },
  ES: { basis: '2025년 사업 보고서', rows: [
    { n: '전기', r: 75, p: 75, c: 'bg-amber-500', note: '코네티컷·매사추세츠·뉴햄프셔 전기.' },
    { n: '가스·수도', r: 25, p: 25, c: 'bg-blue-600', note: '가스·수도(아쿠아리온, 매각).' },
  ] },
  CNP: { basis: '2025년 사업 보고서', rows: [
    { n: '휴스턴 전력망', r: 55, p: 65, c: 'bg-amber-500', note: '휴스턴 송배전. 데이터센터·산업 수요 급증.' },
    { n: '가스', r: 45, p: 35, c: 'bg-blue-600', note: '6개 주 가스 공급.' },
  ] },
  SBUX: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '북미', r: 75, p: 70, c: 'bg-green-700', u: [6, '잔', '라테 한 잔'], note: '미국·캐나다 매장. 회복 계획(백 투 스타벅스) 진행 중.' },
    { n: '해외', r: 20, p: 20, c: 'bg-emerald-500', note: '중국(지분 일부 매각)·일본·유럽.' },
    { n: '마트 판매(네슬레 제휴)', r: 5, p: 10, c: 'bg-amber-700', note: '원두·캡슐 라이선스.' },
  ] },
  ED: { basis: '2025년 사업 보고서', rows: [
    { n: '뉴욕시 전기', r: 70, p: 70, c: 'bg-amber-500', note: '뉴욕시·웨스트체스터 전기.' },
    { n: '뉴욕 가스·증기 난방', r: 30, p: 30, c: 'bg-blue-600', note: '맨해튼 증기 난방도 공급.' },
  ] },
  GPC: { basis: '2025년 사업 보고서', rows: [
    { n: '자동차 부품(NAPA)', r: 60, p: 60, c: 'bg-blue-700', note: '정비소·운전자에게 부품 판매. 미국·유럽·호주.' },
    { n: '산업 부품(모션)', r: 40, p: 40, c: 'bg-amber-500', note: '공장 베어링·벨트·유압 부품 유통(분사 예정).' },
  ] },
  AKAM: { basis: '2025년 사업 보고서', rows: [
    { n: '보안', r: 55, p: 60, c: 'bg-red-600', note: '웹사이트 해킹·디도스 방어.' },
    { n: '콘텐츠 전송', r: 30, p: 25, c: 'bg-blue-600', note: '영상·게임 빠르게 전송. 줄고 있다.' },
    { n: '클라우드 컴퓨팅', r: 15, p: 15, c: 'bg-emerald-500', note: '리노드 클라우드.' },
  ] },
  DD: { basis: '2025년 사업 보고서', rows: [
    { n: '건물·수처리 소재', r: 50, p: 50, c: 'bg-blue-600', note: '타이벡 방수막, 정수 필터 막.' },
    { n: '의료·보호 소재', r: 50, p: 50, c: 'bg-gray-500', note: '방탄 소재 케블라, 의료 포장. 전자 소재(큐니티)는 분사.' },
  ] },
  // ── C등급 (2) ──
  DVA: { basis: '2025년 사업 보고서', rows: [
    { n: '미국 투석 센터', r: 87, p: 92, c: 'bg-red-600', u: [350, '회', '투석 1회'], note: '신부전 환자 투석. 미국 투석 시장 약 37%.' },
    { n: '해외 투석', r: 13, p: 8, c: 'bg-gray-500', note: '해외 투석 센터.' },
  ] },
  BALL: { basis: '2025년 사업 보고서', rows: [
    { n: '북미 음료 캔', r: 50, p: 50, c: 'bg-gray-500', u: [0.1, '개', '알루미늄 캔'], note: '코카콜라·맥주 회사에 알루미늄 캔 공급.' },
    { n: '유럽·중동 음료 캔', r: 30, p: 30, c: 'bg-blue-600', note: '같은 사업.' },
    { n: '남미 음료 캔', r: 20, p: 20, c: 'bg-emerald-500', note: '브라질 등.' },
  ] },
  PYPL: { basis: '2025년 사업 보고서', rows: [
    { n: '온라인 결제(페이팔 버튼)', r: 50, p: 65, c: 'bg-blue-700', note: '쇼핑몰 결제 버튼. 이익의 핵심.' },
    { n: '가맹점 결제 대행(브레인트리)', r: 30, p: 10, c: 'bg-gray-500', note: '대형 기업 결제 처리. 매출은 크지만 이익률 낮다.' },
    { n: '벤모·송금·기타', r: 20, p: 25, c: 'bg-sky-400', note: '개인 간 송금 앱 벤모, 신용 서비스.' },
  ] },
  MDT: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '심장·혈관 기기', r: 37, p: 40, c: 'bg-red-600', note: '심장 박동기, 펄스 부정맥 시술(펄스셀렉트), 인공 판막.' },
    { n: '신경과학(척추·뇌 자극)', r: 29, p: 30, c: 'bg-violet-500', note: '척추 수술 기구, 뇌 자극기.' },
    { n: '수술 기구', r: 25, p: 22, c: 'bg-blue-600', note: '봉합 기구, 수술 로봇(휴고).' },
    { n: '당뇨(미니메드, 분사 예정)', r: 9, p: 8, c: 'bg-gray-400', note: '인슐린 펌프.' },
  ] },
  CHRW: { basis: '2025년 사업 보고서', rows: [
    { n: '북미 트럭 운송 중개', r: 78, p: 80, c: 'bg-blue-600', note: '화주와 트럭 운전사를 연결. AI로 업무 자동화해 이익률 개선.' },
    { n: '국제 화물 주선', r: 22, p: 20, c: 'bg-sky-500', note: '해상·항공 화물.' },
  ] },
  NTAP: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '저장장치(하이브리드 클라우드)', r: 90, p: 95, c: 'bg-blue-700', note: '기업 데이터 저장 장비와 유지보수.' },
    { n: '퍼블릭 클라우드 저장', r: 10, p: 5, c: 'bg-sky-400', note: 'AWS·애저 안에서 쓰는 저장 서비스.' },
  ] },
  TXT: { basis: '2025년 사업 보고서', rows: [
    { n: '비즈니스 제트기(세스나·비치크래프트)', r: 40, p: 45, c: 'bg-sky-500', note: '소형·중형 비즈니스 제트기.' },
    { n: '헬기(벨)', r: 30, p: 30, c: 'bg-gray-700', note: '군용 수직이착륙기(V-280), 헬기.' },
    { n: '산업(골프카트 등)', r: 25, p: 15, c: 'bg-amber-500', note: '이지고 골프카트, 자동차 연료 탱크.' },
    { n: '방산 시스템·금융', r: 5, p: 10, c: 'bg-gray-400', note: '무인기, 항공기 할부.' },
  ] },
  CTSH: { basis: '2025년 사업 보고서', rows: [
    { n: '금융 IT 서비스', r: 30, c: 'bg-blue-700', note: '은행·보험사 IT 아웃소싱.' },
    { n: '의료 IT 서비스', r: 30, c: 'bg-emerald-500', note: '보험사·제약사 IT.' },
    { n: '제조·유통 IT', r: 22, c: 'bg-amber-500', note: '제조·물류 IT.' },
    { n: '통신·미디어·기술', r: 18, c: 'bg-violet-500', note: '통신사 IT.' },
  ] },
  IP: { basis: '2025년 사업 보고서', rows: [
    { n: '북미 골판지 상자', r: 70, p: 85, c: 'bg-amber-700', note: '택배·식품 상자.' },
    { n: '유럽 상자(DS 스미스 인수)', r: 30, p: 15, c: 'bg-emerald-500', note: '유럽 포장.' },
  ] },
  CCI: { basis: '2025년 사업 보고서', rows: [
    { n: '통신탑 임대', r: 100, c: 'bg-blue-700', note: '미국 통신탑 약 4만 개. 광섬유·소형 기지국 사업은 매각.' },
  ] },
  DAL: { basis: '2025년 사업 보고서', rows: [
    { n: '항공권', r: 80, p: 60, c: 'bg-red-700', u: [300, '장', '항공권(평균)'], note: '미국 최대 수익 항공사. 프리미엄 좌석 매출 증가.' },
    { n: '마일리지 판매(아멕스 제휴)', r: 12, p: 30, c: 'bg-blue-600', note: '아멕스 카드 제휴 수입 연 80억 달러 이상. 이익률이 높다.' },
    { n: '정유·화물·기타', r: 8, p: 10, c: 'bg-gray-400', note: '자체 정유 공장, 화물.' },
  ] },
  PPL: { basis: '2025년 사업 보고서', rows: [
    { n: '켄터키 전기·가스', r: 50, p: 50, c: 'bg-amber-500', note: '켄터키 전기.' },
    { n: '펜실베이니아 전력망', r: 35, p: 35, c: 'bg-blue-600', note: '송배전.' },
    { n: '로드아일랜드', r: 15, p: 15, c: 'bg-gray-500', note: '전기·가스.' },
  ] },
  ADM: { basis: '2025년 사업 보고서', rows: [
    { n: '곡물 매입·가공(콩·옥수수 기름)', r: 75, p: 50, c: 'bg-amber-600', note: '세계 곡물을 사서 기름·사료로 가공해 판다. 마진이 얇다.' },
    { n: '전분·감미료·에탄올', r: 15, p: 25, c: 'bg-gray-500', note: '옥수수 시럽, 에탄올.' },
    { n: '영양(식품 원료·사료 첨가제)', r: 10, p: 25, c: 'bg-emerald-500', note: '향료·단백질 원료.' },
  ] },
  ESS: { basis: '2025년 사업 보고서', rows: [
    { n: '서부 해안 아파트 임대', r: 100, c: 'bg-blue-600', u: [2900, '달', '아파트 한 달 월세'], note: '샌프란시스코·LA·시애틀 아파트 약 6만 가구.' },
  ] },
  OMC: { basis: '2025년 사업 보고서', rows: [
    { n: '광고·미디어 구매', r: 55, p: 55, c: 'bg-gray-700', note: '광고 제작, 광고 지면 구매 대행. IPG 인수로 세계 최대 광고 그룹.' },
    { n: '홍보·헬스케어 마케팅', r: 25, p: 25, c: 'bg-blue-600', note: '홍보, 제약 마케팅.' },
    { n: '기타 마케팅 서비스', r: 20, p: 20, c: 'bg-gray-400', note: '행사·고객 관리.' },
  ] },
  JBL: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '데이터센터·AI 장비 위탁 생산', r: 40, p: 45, c: 'bg-violet-600', note: '클라우드 회사 서버 랙·전원 장비 조립.' },
    { n: '휴대폰 부품(애플 등)', r: 30, p: 25, c: 'bg-gray-600', note: '아이폰 부품·케이스.' },
    { n: '의료·자동차·기타', r: 30, p: 30, c: 'bg-emerald-500', note: '의료 기기, 전기차 부품.' },
  ] },
  REG: { basis: '2025년 사업 보고서', rows: [
    { n: '마트 중심 상가 임대', r: 100, c: 'bg-emerald-600', note: '대형 마트(크로거·퍼블릭스)가 있는 동네 상가. 장보러 오니 공실이 적다.' },
  ] },
  UPS: { basis: '2025년 사업 보고서', rows: [
    { n: '미국 택배', r: 63, p: 45, c: 'bg-amber-800', u: [12, '개', '택배 1개(평균)'], note: '하루 약 2,000만 개. 아마존 물량을 줄여 이익률 개선 중.' },
    { n: '국제 택배', r: 20, p: 40, c: 'bg-blue-600', note: '해외 특송. 이익률이 높다.' },
    { n: '물류·화물(공급망)', r: 17, p: 15, c: 'bg-gray-500', note: '의료 물류, 화물 주선.' },
  ] },
  VZ: { basis: '2025년 사업 보고서', rows: [
    { n: '휴대폰 서비스(개인)', r: 55, p: 65, c: 'bg-red-600', u: [60, '달', '휴대폰 한 달 요금'], note: '미국 최대 휴대폰 가입자. 프론티어 인수로 광인터넷 확대.' },
    { n: '휴대폰 기기 판매', r: 20, p: 3, c: 'bg-gray-500', note: '휴대폰 할부 판매. 거의 원가.' },
    { n: '기업·유선', r: 25, p: 32, c: 'bg-blue-600', note: '기업 통신·집 인터넷(파이오스).' },
  ] },
  FFIV: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '시스템(장비)', r: 25, p: 25, c: 'bg-red-600', note: '웹사이트 트래픽 분산·보안 장비(빅IP).' },
    { n: '소프트웨어·구독', r: 25, p: 30, c: 'bg-violet-500', note: '보안 소프트웨어.' },
    { n: '유지보수', r: 50, p: 45, c: 'bg-gray-500', note: '설치 장비 유지보수 계약.' },
  ] },
  T: { basis: '2025년 사업 보고서', rows: [
    { n: '휴대폰 서비스', r: 55, p: 75, c: 'bg-sky-500', u: [55, '달', '휴대폰 한 달 요금'], note: '미국 2위 휴대폰.' },
    { n: '휴대폰 기기 판매', r: 18, p: 2, c: 'bg-gray-500', note: '기기 판매.' },
    { n: '광인터넷·유선', r: 27, p: 23, c: 'bg-blue-700', note: '광인터넷은 성장, 구리 유선은 축소.' },
  ] },
  TER: { basis: '2025년 사업 보고서', rows: [
    { n: '반도체 시험 장비', r: 75, p: 85, c: 'bg-blue-700', note: '완성된 칩이 제대로 작동하는지 검사. AI 칩(GPU·HBM) 수요.' },
    { n: '로봇(유니버설 로봇)', r: 15, p: 0, c: 'bg-amber-500', note: '협동 로봇. 적자.' },
    { n: '제품 시험(무선·저장장치)', r: 10, p: 15, c: 'bg-gray-500', note: '휴대폰·저장장치 검사.' },
  ] },
  UAL: { basis: '2025년 사업 보고서', rows: [
    { n: '항공권', r: 88, p: 65, c: 'bg-blue-700', u: [280, '장', '항공권(평균)'], note: '국제선 비중이 큰 항공사.' },
    { n: '마일리지 판매(체이스 제휴)', r: 7, p: 28, c: 'bg-amber-500', note: '체이스 카드사에 마일리지 판매.' },
    { n: '화물·기타', r: 5, p: 7, c: 'bg-gray-400', note: '항공 화물.' },
  ] },
  WFC: { basis: '2025년 사업 보고서', rows: [
    { n: '개인 은행·대출', r: 45, p: 40, c: 'bg-red-600', note: '지점·카드·주택 대출. 자산 상한 규제가 풀려 성장 재개.' },
    { n: '기업 은행', r: 20, p: 25, c: 'bg-blue-700', note: '중견기업 대출.' },
    { n: '투자은행', r: 17, p: 20, c: 'bg-gray-600', note: '대기업 금융.' },
    { n: '자산관리', r: 18, p: 15, c: 'bg-emerald-500', note: '부자 고객 관리.' },
  ] },
  CAH: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '의약품 도매', r: 90, p: 75, c: 'bg-red-600', note: '약국·병원 약 배달. 매출은 크지만 1%대 마진.' },
    { n: '전문 의약품·의료 소모품 등', r: 10, p: 25, c: 'bg-blue-600', note: '항암제 유통, 재택 의료 소모품.' },
  ] },
  DG: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '생필품(식품·세제)', r: 82, p: 75, c: 'bg-amber-500', u: [15, '번', '장보기 1회(평균)'], note: '시골 소도시 1달러샵(약 2만 곳). 자주 사는 물건 위주.' },
    { n: '계절·가정·의류', r: 18, p: 25, c: 'bg-gray-500', note: '이익률이 더 높은 상품.' },
  ] },
  MMM: { basis: '2025년 사업 보고서', rows: [
    { n: '산업·안전 용품', r: 46, p: 50, c: 'bg-red-600', note: '연마재·테이프·마스크·보호 장비.' },
    { n: '전자·운송 소재', r: 34, p: 32, c: 'bg-blue-600', note: '디스플레이 필름, 자동차 소재.' },
    { n: '생활용품', r: 20, p: 18, c: 'bg-amber-500', u: [5, '개', '포스트잇 한 묶음'], note: '포스트잇·스카치 테이프·청소용품.' },
  ] },
  CVX: { basis: '2025년 사업 보고서', rows: [
    { n: '원유·가스 생산', r: 30, p: 80, c: 'bg-gray-800', u: [65, '배럴', '원유 1배럴'], note: '퍼미안·카자흐스탄·헤스 인수(가이아나 지분).' },
    { n: '정유·주유소·화학', r: 70, p: 20, c: 'bg-blue-600', note: '정유·주유소(셰브론·텍사코). 매출은 크지만 남는 돈은 적다.' },
  ] },
  TSN: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '닭고기', r: 30, p: 45, c: 'bg-amber-500', note: '미국 최대 닭고기 회사.' },
    { n: '가공식품(지미딘·볼파크)', r: 18, p: 55, c: 'bg-red-600', note: '소시지·베이컨·핫도그. 이익률이 가장 높다.' },
    { n: '소고기', r: 37, p: -5, c: 'bg-red-800', note: '소 값이 비싸 적자.' },
    { n: '돼지고기·해외', r: 15, p: 5, c: 'bg-pink-400', note: '돼지고기 등.' },
  ] },
  UDR: { basis: '2025년 사업 보고서', rows: [
    { n: '아파트 임대', r: 100, c: 'bg-blue-600', u: [2300, '달', '아파트 한 달 월세'], note: '미국 대도시 아파트 약 6만 가구.' },
  ] },
  EXC: { basis: '2025년 사업 보고서', rows: [
    { n: '전력망(시카고·필라델피아·볼티모어 등)', r: 100, c: 'bg-amber-500', note: '6개 전력 회사 약 1,000만 고객에게 전기·가스 배달. 발전은 분사(컨스텔레이션).' },
  ] },
  AMCR: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '유연 포장(과자 봉지·의약 포장)', r: 75, p: 80, c: 'bg-gray-500', note: '식품·의약품 비닐 포장.' },
    { n: '단단한 포장(음료병 등)', r: 25, p: 20, c: 'bg-blue-600', note: '플라스틱 병. 베리글로벌 합병.' },
  ] },
  L: { basis: '2025년 사업 보고서', rows: [
    { n: '보험(CNA)', r: 80, p: 70, c: 'bg-blue-700', note: '기업 보험 CNA 지분 약 90%.' },
    { n: '가스관(보드워크)', r: 10, p: 18, c: 'bg-gray-600', note: '천연가스관.' },
    { n: '호텔(로우스 호텔)·기타', r: 10, p: 12, c: 'bg-amber-500', note: '호텔 체인, 포장재 회사.' },
  ] },
  J: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '인프라·첨단 시설 설계', r: 75, p: 70, c: 'bg-blue-600', note: '수도·교통·반도체 공장·데이터센터 설계·감리.' },
    { n: '컨설팅(PA 컨설팅)', r: 15, p: 20, c: 'bg-violet-500', note: '영국 경영 컨설팅.' },
    { n: '기타', r: 10, p: 10, c: 'bg-gray-400', note: '정부 서비스 등.' },
  ] },
  EOG: { basis: '2025년 사업 보고서', rows: [
    { n: '원유', r: 60, p: 70, c: 'bg-gray-800', u: [65, '배럴', '원유 1배럴'], note: '텍사스·뉴멕시코 셰일. 원가가 낮은 편.' },
    { n: '천연가스·가스액', r: 40, p: 30, c: 'bg-blue-500', note: '가스 비중을 늘리는 중.' },
  ] },
  BG: { basis: '2025년 사업 보고서', rows: [
    { n: '곡물 가공(콩 기름·사료)', r: 70, p: 70, c: 'bg-amber-600', note: '세계 최대 콩 가공. 비테라 합병.' },
    { n: '식용유 정제', r: 20, p: 25, c: 'bg-yellow-500', note: '식품 회사용 식용유.' },
    { n: '제분·기타', r: 10, p: 5, c: 'bg-gray-400', note: '밀가루 등.' },
  ] },
  HST: { basis: '2025년 사업 보고서', rows: [
    { n: '호텔 객실', r: 60, p: 70, c: 'bg-blue-600', u: [300, '박', '고급 호텔 1박'], note: '메리어트·하얏트 간판을 단 고급 호텔 약 80개를 소유.' },
    { n: '호텔 식음료·기타', r: 40, p: 30, c: 'bg-amber-500', note: '연회·레스토랑.' },
  ] },
  KIM: { basis: '2025년 사업 보고서', rows: [
    { n: '마트 중심 상가 임대', r: 100, c: 'bg-emerald-600', note: '미국 동네 상가 약 570개.' },
  ] },
  PPG: { basis: '2025년 사업 보고서', rows: [
    { n: '산업용 도료(자동차·항공)', r: 40, p: 35, c: 'bg-gray-600', note: '자동차 공장 도장, 항공기 도료.' },
    { n: '건물·자동차 수리용 도료', r: 60, p: 65, c: 'bg-blue-600', u: [45, '통', '페인트 한 통'], note: '건축 페인트(멕시코 콤엑스), 자동차 수리 도료.' },
  ] },
  FE: { basis: '2025년 사업 보고서', rows: [
    { n: '전력 배전(오하이오·펜실베이니아 등)', r: 75, p: 65, c: 'bg-amber-500', note: '5개 주 약 600만 고객.' },
    { n: '송전', r: 25, p: 35, c: 'bg-gray-600', note: '고압 송전망.' },
  ] },
  HSIC: { basis: '2025년 사업 보고서', rows: [
    { n: '치과 소모품·장비 유통', r: 60, p: 55, c: 'bg-sky-500', note: '세계 최대 치과 재료 유통.' },
    { n: '의원 의료 소모품', r: 35, p: 30, c: 'bg-blue-600', note: '의원용 소모품.' },
    { n: '치과 소프트웨어', r: 5, p: 15, c: 'bg-violet-500', note: '진료 관리 소프트웨어(덴트릭스).' },
  ] },
  COP: { basis: '2025년 사업 보고서', rows: [
    { n: '미국 셰일·알래스카', r: 70, p: 70, c: 'bg-gray-800', u: [65, '배럴', '원유 1배럴'], note: '퍼미안·알래스카 원유. 마라톤오일 인수.' },
    { n: '해외(LNG·노르웨이 등)', r: 30, p: 30, c: 'bg-blue-600', note: '카타르 LNG 등.' },
  ] },
  STZ: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '맥주(코로나·모델로)', r: 85, p: 95, c: 'bg-yellow-500', u: [2, '병', '모델로 맥주 한 병'], note: '미국 수입 맥주 1위. 히스패닉 소비 위축·관세로 둔화.' },
    { n: '와인·위스키', r: 15, p: 5, c: 'bg-red-800', note: '저가 와인 매각, 고급 와인만 남김.' },
  ] },
  KMB: { basis: '2025년 사업 보고서', rows: [
    { n: '북미 생활용품', r: 55, p: 65, c: 'bg-blue-600', u: [25, '팩', '하기스 기저귀 한 팩'], note: '하기스·클리넥스·코텍스.' },
    { n: '해외 생활용품', r: 45, p: 35, c: 'bg-emerald-500', note: '해외 판매(켄뷰 인수로 타이레놀 추가 예정).' },
  ] },
  VTR: { basis: '2025년 사업 보고서', rows: [
    { n: '노인 주거 시설 운영', r: 65, p: 50, c: 'bg-emerald-600', note: '실버타운 직접 운영.' },
    { n: '병원·연구소 임대', r: 35, p: 50, c: 'bg-blue-600', note: '의원 건물·대학 연구소 임대.' },
  ] },
  BMY: { basis: '2025년 사업 보고서', rows: [
    { n: '성장 의약품(옵디보·브레얀지 등)', r: 55, p: 50, c: 'bg-blue-600', note: '면역 항암제, 세포 치료제, 조현병 약 코벤피.' },
    { n: '기존 의약품(엘리퀴스·레블리미드)', r: 45, p: 50, c: 'bg-gray-500', note: '혈전 약 엘리퀴스(특허 만료 임박), 혈액암 약(복제약).' },
  ] },
  NRG: { basis: '2025년 사업 보고서', rows: [
    { n: '텍사스 전기 판매', r: 45, p: 50, c: 'bg-amber-500', note: '텍사스 가정 전기 소매(릴라이언트).' },
    { n: '동부 전기·가스 판매', r: 40, p: 30, c: 'bg-blue-600', note: '동부 소매·발전.' },
    { n: '스마트홈(바이빈트)', r: 15, p: 20, c: 'bg-violet-500', note: '가정 보안·자동화 구독.' },
  ] },
  SJM: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '커피(폴저스·던킨 원두)', r: 33, p: 45, c: 'bg-amber-800', note: '마트 커피. 원두 값 폭등.' },
    { n: '반려동물 간식(밀크본)', r: 20, p: 25, c: 'bg-orange-500', note: '개 간식.' },
    { n: '과자(호스티스 트윙키)', r: 15, p: 5, c: 'bg-pink-400', note: '인수 후 부진.' },
    { n: '잼·땅콩버터(스머커스·지프)', r: 25, p: 22, c: 'bg-red-600', note: '잼·땅콩버터, 냉동 샌드위치(언크러스터블).' },
    { n: '기타', r: 7, p: 3, c: 'bg-gray-400', note: '해외·외식.' },
  ] },
  HBAN: { basis: '2025년 사업 보고서', rows: [
    { n: '대출·예금 이자', r: 72, p: 70, c: 'bg-emerald-600', note: '미국 중서부 지역 은행. 캐딘스 은행 인수.' },
    { n: '수수료', r: 28, p: 30, c: 'bg-gray-500', note: '자산관리·카드 수수료.' },
  ] },
  PHM: { basis: '2025년 사업 보고서', rows: [
    { n: '주택 건설·판매', r: 97, p: 93, c: 'bg-blue-700', u: [550000, '채', '새 집 한 채'], note: '미국 3위 주택 건설사. 은퇴자 단지(델웹)도 있다.' },
    { n: '주택담보대출', r: 3, p: 7, c: 'bg-emerald-500', note: '구매자 대출.' },
  ] },
  KEY: { basis: '2025년 사업 보고서', rows: [
    { n: '개인 은행', r: 50, p: 45, c: 'bg-red-600', note: '오하이오 등 지점.' },
    { n: '기업·투자은행', r: 50, p: 55, c: 'bg-blue-700', note: '중견기업 대출·자문.' },
  ] },
  FRT: { basis: '2025년 사업 보고서', rows: [
    { n: '고급 상가·복합 단지 임대', r: 100, c: 'bg-blue-600', note: '부유한 동네 상가 약 100곳. 58년 연속 배당 인상.' },
  ] },
  ZBH: { basis: '2025년 사업 보고서', rows: [
    { n: '무릎 인공관절', r: 40, p: 42, c: 'bg-blue-600', u: [5000, '개', '인공 무릎 관절'], note: '세계 1위.' },
    { n: '고관절', r: 25, p: 27, c: 'bg-emerald-500', note: '엉덩이 관절.' },
    { n: '스포츠의학·외상·기타', r: 35, p: 31, c: 'bg-gray-500', note: '어깨 관절, 수술 로봇(로사).' },
  ] },
  JCI: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '미주 빌딩 설비', r: 60, p: 60, c: 'bg-blue-700', note: '빌딩·데이터센터 냉방기(요크), 소방·보안 설비.' },
    { n: '유럽·아시아 빌딩 설비', r: 40, p: 40, c: 'bg-emerald-500', note: '같은 사업.' },
  ] },
  IBM: { basis: '2025년 사업 보고서', rows: [
    { n: '소프트웨어(레드햇·데이터·AI)', r: 45, p: 65, c: 'bg-blue-700', note: '레드햇 리눅스·하이브리드 클라우드, 데이터베이스.' },
    { n: '컨설팅', r: 31, p: 15, c: 'bg-gray-500', note: 'IT 컨설팅.' },
    { n: '인프라(메인프레임)', r: 22, p: 18, c: 'bg-violet-500', note: '은행용 대형 컴퓨터 z17.' },
    { n: '기타', r: 2, p: 2, c: 'bg-gray-400', note: '금융 등.' },
  ] },
  INCY: { basis: '2025년 사업 보고서', rows: [
    { n: '자카피(혈액암 약)', r: 65, p: 70, c: 'bg-red-600', note: '골수 섬유증 약. 2028년 특허 만료.' },
    { n: '옵젤루라(피부 크림)·기타 약', r: 20, p: 15, c: 'bg-pink-400', note: '아토피·백반증 크림.' },
    { n: '로열티(노바티스 자카비 등)', r: 15, p: 15, c: 'bg-emerald-500', note: '해외 판매 로열티.' },
  ] },
  SWK: { basis: '2025년 사업 보고서', rows: [
    { n: '공구·실외 장비', r: 85, p: 80, c: 'bg-yellow-500', u: [150, '개', '디월트 전동 드릴'], note: '디월트·스탠리·크래프츠맨 공구.' },
    { n: '산업용 고정 장치', r: 15, p: 20, c: 'bg-gray-500', note: '자동차·항공 볼트.' },
  ] },
  BAC: { basis: '2025년 사업 보고서', rows: [
    { n: '개인 은행', r: 40, p: 40, c: 'bg-red-600', note: '미국 최대 예금. 지점·카드·주택 대출.' },
    { n: '자산관리(메릴린치)', r: 23, p: 15, c: 'bg-blue-600', note: '부자 고객.' },
    { n: '기업 은행', r: 22, p: 28, c: 'bg-gray-700', note: '대기업 대출·자금 관리.' },
    { n: '트레이딩', r: 15, p: 17, c: 'bg-emerald-500', note: '주식·채권 트레이딩.' },
  ] },
  NEM: { basis: '2025년 사업 보고서', rows: [
    { n: '금', r: 85, p: 90, c: 'bg-yellow-500', u: [4000, '온스', '금 1온스'], note: '세계 최대 금광 회사. 금값 급등으로 이익 급증.' },
    { n: '구리·은·기타', r: 15, p: 10, c: 'bg-amber-700', note: '같이 나오는 금속.' },
  ] },
  FLEX: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '데이터센터·전력 장비 등 신뢰성 제품', r: 55, p: 60, c: 'bg-blue-600', note: '데이터센터 전원 장비, 자동차·의료 부품.' },
    { n: '소비자 기기 조립', r: 45, p: 40, c: 'bg-gray-500', note: '가전·통신 장비 위탁 생산.' },
  ] },
  IVZ: { basis: '2025년 사업 보고서', rows: [
    { n: 'ETF 운용(QQQ 등)', r: 35, p: 45, c: 'bg-blue-700', note: '나스닥100 ETF(QQQ) 등. QQQ 구조 전환으로 수수료 증가 예정.' },
    { n: '액티브 펀드', r: 65, p: 55, c: 'bg-gray-500', note: '자금이 빠져나가는 중.' },
  ] },
  RF: { basis: '2025년 사업 보고서', rows: [
    { n: '대출·예금 이자', r: 70, p: 68, c: 'bg-emerald-600', note: '미국 남동부 지역 은행.' },
    { n: '수수료', r: 30, p: 32, c: 'bg-gray-500', note: '자산관리·카드 수수료.' },
  ] },
  DOC: { basis: '2025년 사업 보고서', rows: [
    { n: '외래 진료 건물 임대', r: 50, p: 50, c: 'bg-blue-600', note: '병원 근처 의원 건물.' },
    { n: '바이오 연구소 임대', r: 35, p: 38, c: 'bg-emerald-500', note: '보스턴·샌프란시스코 연구소.' },
    { n: '노인 주거', r: 15, p: 12, c: 'bg-gray-500', note: '실버타운.' },
  ] },
  FITB: { basis: '2025년 사업 보고서', rows: [
    { n: '대출·예금 이자', r: 65, p: 63, c: 'bg-emerald-600', note: '미국 중서부·남동부 은행. 코메리카 인수.' },
    { n: '수수료', r: 35, p: 37, c: 'bg-gray-500', note: '결제·자산관리 수수료.' },
  ] },
  WDC: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '데이터센터 하드디스크', r: 90, p: 95, c: 'bg-blue-700', u: [300, '개', '대용량 하드디스크'], note: '클라우드 회사 대용량 저장장치. 플래시(샌디스크)는 분사.' },
    { n: '개인용', r: 10, p: 5, c: 'bg-gray-500', note: '외장 하드.' },
  ] },
  MRVL: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '데이터센터(맞춤 AI 칩·광통신 칩)', r: 75, p: 85, c: 'bg-red-600', note: '아마존·마이크로소프트 맞춤 AI 칩, 데이터센터 광통신 칩.' },
    { n: '통신·자동차·기타', r: 25, p: 15, c: 'bg-gray-500', note: '기지국·네트워크 칩.' },
  ] },
  MU: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '데이터센터 메모리(HBM 등)', r: 55, p: 65, c: 'bg-blue-700', note: 'AI 칩 옆에 붙는 고대역폭 메모리(HBM), 서버 D램.' },
    { n: 'PC·휴대폰 메모리', r: 30, p: 25, c: 'bg-gray-500', note: 'PC·휴대폰 D램·낸드.' },
    { n: '자동차·임베디드', r: 15, p: 10, c: 'bg-emerald-500', note: '자동차 메모리.' },
  ] },
  IFF: { basis: '2025년 사업 보고서', rows: [
    { n: '맛 원료', r: 30, p: 30, c: 'bg-amber-500', note: '음료·과자 맛 원료.' },
    { n: '향료', r: 22, p: 25, c: 'bg-pink-400', note: '향수·세제 향.' },
    { n: '식품 첨가물·영양', r: 30, p: 25, c: 'bg-emerald-500', note: '유산균·식감 원료.' },
    { n: '바이오 효소', r: 18, p: 20, c: 'bg-blue-600', note: '세제·바이오 연료 효소.' },
  ] },
  ILMN: { basis: '2025년 사업 보고서', rows: [
    { n: '유전자 분석 시약(소모품)', r: 70, p: 80, c: 'bg-orange-500', note: '장비에 쓰는 시약. 반복 매출.' },
    { n: '유전자 분석 장비', r: 15, p: 5, c: 'bg-gray-600', note: '염기서열 분석기.' },
    { n: '정비·기타', r: 15, p: 15, c: 'bg-blue-600', note: '장비 정비.' },
  ] },
  BKR: { basis: '2025년 사업 보고서', rows: [
    { n: '가스 터빈·LNG 설비', r: 45, p: 50, c: 'bg-blue-700', note: 'LNG 공장 압축기·터빈, 데이터센터 발전기.' },
    { n: '유전 서비스·장비', r: 55, p: 50, c: 'bg-gray-700', note: '시추·완공 서비스.' },
  ] },
  KMI: { basis: '2025년 사업 보고서', rows: [
    { n: '천연가스관', r: 65, p: 68, c: 'bg-blue-700', note: '미국 천연가스의 약 40%가 이 회사 관을 지난다. 데이터센터·LNG 수요 증가.' },
    { n: '정제품 송유관', r: 15, p: 15, c: 'bg-gray-600', note: '휘발유 송유관.' },
    { n: '저장 터미널', r: 12, p: 12, c: 'bg-amber-500', note: '기름 저장 탱크.' },
    { n: '이산화탄소', r: 8, p: 5, c: 'bg-gray-400', note: '원유 회수용 이산화탄소.' },
  ] },
  EQT: { basis: '2025년 사업 보고서', rows: [
    { n: '천연가스 생산', r: 85, p: 80, c: 'bg-blue-600', u: [3, '천 입방피트', '천연가스 1천 입방피트'], note: '미국 최대 천연가스 생산 회사(애팔래치아).' },
    { n: '가스관(에퀴트랜스)', r: 15, p: 20, c: 'bg-gray-600', note: '자체 가스관.' },
  ] },
  FCX: { basis: '2025년 사업 보고서', rows: [
    { n: '구리', r: 70, p: 65, c: 'bg-amber-700', u: [10, '파운드', '구리 1파운드'], note: '세계 최대 상장 구리 회사. 인도네시아 그라스버그 광산.' },
    { n: '금', r: 20, p: 30, c: 'bg-yellow-500', note: '그라스버그에서 같이 나오는 금.' },
    { n: '몰리브덴·기타', r: 10, p: 5, c: 'bg-gray-500', note: '합금용 금속.' },
  ] },
  CIEN: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '광통신 장비', r: 70, p: 75, c: 'bg-blue-700', note: '데이터센터 간·해저 광통신 장비. AI 데이터센터 연결 수요.' },
    { n: '라우팅·소프트웨어·서비스', r: 30, p: 25, c: 'bg-gray-500', note: '통신사 네트워크 장비 정비.' },
  ] },
  FSLR: { basis: '2025년 사업 보고서', rows: [
    { n: '태양광 모듈', r: 100, c: 'bg-sky-600', note: '미국에서 만드는 박막 태양광 모듈. 미국 생산 세액공제가 이익의 큰 부분.' },
  ] },
  C: { basis: '2025년 사업 보고서', rows: [
    { n: '기업 자금 관리·무역 금융', r: 25, p: 35, c: 'bg-blue-700', note: '다국적 기업 송금·자금 관리. 이익의 핵심.' },
    { n: '트레이딩·증권 서비스', r: 30, p: 30, c: 'bg-gray-700', note: '채권·외환 트레이딩, 증권 보관.' },
    { n: '미국 개인 카드', r: 25, p: 20, c: 'bg-red-600', note: '신용카드.' },
    { n: '자산관리·투자은행', r: 20, p: 15, c: 'bg-emerald-500', note: '부자 고객, 인수합병 자문.' },
  ] },
  OXY: { basis: '2025년 사업 보고서', rows: [
    { n: '원유·가스 생산', r: 75, p: 80, c: 'bg-gray-800', u: [65, '배럴', '원유 1배럴'], note: '퍼미안 원유. 버크셔가 대주주.' },
    { n: '가스관·마케팅', r: 10, p: 5, c: 'bg-blue-600', note: '운송·거래.' },
    { n: '화학(옥시켐, 매각)', r: 15, p: 15, c: 'bg-gray-500', note: '염소·PVC 원료(버크셔에 매각).' },
  ] },
  AIG: { basis: '2025년 사업 보고서', rows: [
    { n: '북미 기업 보험', r: 45, p: 45, c: 'bg-blue-700', note: '대기업 재산·배상책임 보험.' },
    { n: '해외 기업 보험', r: 35, p: 35, c: 'bg-emerald-500', note: '해외 기업·특수 보험.' },
    { n: '개인 보험 등', r: 20, p: 20, c: 'bg-gray-500', note: '고급 주택·여행 보험. 생명보험(코어브리지)은 분리.' },
  ] },
  VST: { basis: '2025년 사업 보고서', rows: [
    { n: '텍사스 발전·전기 판매', r: 60, p: 60, c: 'bg-amber-500', note: '텍사스 가스·원전 발전, 가정 전기 판매(TXU).' },
    { n: '동부·서부 발전(원전 등)', r: 40, p: 40, c: 'bg-violet-500', note: '원전 전력을 데이터센터에 장기 판매.' },
  ] },
  EXE: { basis: '2025년 사업 보고서', rows: [
    { n: '천연가스 생산', r: 100, c: 'bg-blue-600', u: [3, '천 입방피트', '천연가스 1천 입방피트'], note: '체서피크·사우스웨스턴 합병. 미국 최대 천연가스 생산 회사.' },
  ] },
  FTV: { basis: '2025년 사업 보고서', rows: [
    { n: '정밀 계측(플루크·텍트로닉스)', r: 65, p: 65, c: 'bg-yellow-500', note: '전기 측정기, 오실로스코프.' },
    { n: '의료 멸균·소프트웨어', r: 35, p: 35, c: 'bg-blue-600', note: '병원 멸균 관리. 일부는 분사.' },
  ] },
  TWLO: { basis: '2025년 사업 보고서', rows: [
    { n: '문자·전화·이메일 API', r: 93, p: 100, c: 'bg-red-600', u: [0.01, '건', '인증 문자 1건'], note: '앱이 보내는 인증 문자·알림을 대신 보내 주고 건당 요금.' },
    { n: '고객 데이터(세그먼트)', r: 7, p: 0, c: 'bg-gray-400', note: '고객 데이터 플랫폼.' },
  ] },
  // ── D등급 ──
  SMCI: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: 'AI·데이터센터 서버', r: 95, p: 97, c: 'bg-emerald-600', note: '엔비디아 GPU를 넣은 AI 서버 조립. 매출은 크지만 이익률이 낮다(약 3~5%).' },
    { n: '부품·기타', r: 5, p: 3, c: 'bg-gray-400', note: '서버 부품.' },
  ] },
  ALB: { basis: '2025년 사업 보고서', rows: [
    { n: '리튬', r: 60, p: 30, c: 'bg-sky-500', note: '전기차 배터리용 리튬. 리튬 값 폭락으로 이익이 사라졌다.' },
    { n: '브롬(난연제)', r: 25, p: 50, c: 'bg-amber-600', note: '불에 잘 안 타게 하는 화학 원료. 안정적.' },
    { n: '정유 촉매', r: 15, p: 20, c: 'bg-gray-500', note: '정유 공장 촉매.' },
  ] },
  BBY: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '컴퓨터·휴대폰', r: 45, p: 45, c: 'bg-blue-700', u: [900, '대', '노트북'], note: '노트북·아이폰·태블릿.' },
    { n: '가전·TV', r: 35, p: 30, c: 'bg-gray-500', note: 'TV·냉장고·세탁기.' },
    { n: '게임·서비스·기타', r: 20, p: 25, c: 'bg-amber-500', note: '게임, 설치·수리(긱스쿼드), 회원비.' },
  ] },
  BA: { basis: '2025년 사업 보고서', rows: [
    { n: '여객기', r: 45, p: -60, c: 'bg-blue-700', u: [110000000, '대', '737 맥스 한 대'], note: '737·787 여객기. 생산 차질·파업으로 적자.' },
    { n: '방산·우주', r: 30, p: -20, c: 'bg-gray-700', note: '전투기·급유기·우주선. 고정가 계약 손실.' },
    { n: '정비·부품(글로벌 서비스)', r: 25, p: 180, c: 'bg-emerald-500', note: '항공기 부품·정비. 유일하게 꾸준히 버는 사업.' },
  ] },
  HAS: { basis: '2025년 사업 보고서', rows: [
    { n: '장난감·보드게임', r: 60, p: 10, c: 'bg-red-600', note: '트랜스포머·너프·모노폴리. 부진.' },
    { n: '디지털·카드 게임(위저즈 오브 더 코스트)', r: 35, p: 85, c: 'bg-violet-600', u: [5, '팩', '매직 더 개더링 카드 한 팩'], note: '매직 더 개더링 카드, 던전앤드래곤, 모노폴리 고. 이익의 대부분.' },
    { n: '영화·라이선스', r: 5, p: 5, c: 'bg-gray-400', note: '라이선스.' },
  ] },
  HUM: { basis: '2025년 사업 보고서', rows: [
    { n: '노인 건강보험(메디케어)', r: 85, p: 60, c: 'bg-emerald-600', note: '노인 정부 보험을 민간이 운영. 의료비 증가·평가 등급 하락으로 이익 급감.' },
    { n: '의원·약국·재택 의료(센터웰)', r: 15, p: 40, c: 'bg-blue-600', note: '노인 전문 의원, 우편 약국.' },
  ] },
  GM: { basis: '2025년 사업 보고서', rows: [
    { n: '북미 자동차', r: 80, p: 80, c: 'bg-blue-700', u: [50000, '대', '자동차 한 대(평균)'], note: '쉐보레·GMC 픽업트럭·SUV가 이익 대부분. 관세 비용 부담.' },
    { n: '해외 자동차', r: 8, p: 3, c: 'bg-gray-500', note: '한국·남미 등. 중국은 적자.' },
    { n: '할부 금융(GM 파이낸셜)', r: 12, p: 17, c: 'bg-emerald-500', note: '차량 할부·리스.' },
  ], how: '자율주행(크루즈) 사업은 접었다.' },
  EIX: { basis: '2025년 사업 보고서', rows: [
    { n: '남캘리포니아 전기', r: 100, c: 'bg-amber-500', note: '남캘리포니아 약 1,500만 명. 2025년 LA 산불 책임 배상 위험.' },
  ] },
  EL: { basis: '2026 회계연도 사업 보고서', rows: [
    { n: '스킨케어(에스티로더·라메르)', r: 48, p: 45, c: 'bg-sky-500', note: '고급 화장품. 중국·면세점 판매 급감.' },
    { n: '메이크업(맥·클리니크)', r: 28, p: 15, c: 'bg-pink-500', note: '색조 화장품.' },
    { n: '향수(톰포드·르라보)', r: 18, p: 35, c: 'bg-violet-500', note: '고급 향수. 이익률이 가장 높다.' },
    { n: '헤어 등', r: 6, p: 5, c: 'bg-gray-400', note: '아베다 등.' },
  ] },
  HPQ: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: 'PC', r: 68, p: 45, c: 'bg-blue-600', u: [800, '대', '노트북'], note: '노트북·데스크톱. 이익률 5%대.' },
    { n: '프린터', r: 32, p: 55, c: 'bg-gray-600', u: [40, '개', '프린터 잉크 카트리지'], note: '프린터는 싸게, 잉크로 번다. 이익률 약 18%.' },
  ] },
  D: { basis: '2025년 사업 보고서', rows: [
    { n: '버지니아 전기', r: 70, p: 75, c: 'bg-amber-500', note: '세계 최대 데이터센터 지역(북버지니아)에 전기 공급.' },
    { n: '캐롤라이나 전기·가스', r: 20, p: 15, c: 'bg-blue-600', note: '사우스캐롤라이나.' },
    { n: '해상 풍력·기타', r: 10, p: 10, c: 'bg-emerald-500', note: '버지니아 해상 풍력 건설.' },
  ] },
  GPN: { basis: '2025년 사업 보고서', rows: [
    { n: '가맹점 결제', r: 100, c: 'bg-blue-700', note: '가게 카드 결제 처리. 월드페이 인수, 카드 발급 처리(이슈어) 사업은 매각.' },
  ] },
  DLTR: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '달러트리', r: 100, c: 'bg-emerald-600', u: [1.25, '개', '달러트리 상품 하나'], note: '대부분 1.25달러짜리 상품. 패밀리달러는 매각.' },
  ] },
  PFE: { basis: '2025년 사업 보고서', rows: [
    { n: '일반 처방약(엘리퀴스·심장·폐)', r: 40, p: 45, c: 'bg-blue-600', note: '혈전 약 엘리퀴스(BMS 공동), 빈다켈.' },
    { n: '항암제(시젠 인수)', r: 25, p: 20, c: 'bg-red-600', note: '항체약물접합체 등.' },
    { n: '백신(프리베나 폐렴 백신 등)', r: 20, p: 25, c: 'bg-emerald-500', note: '폐렴·RSV 백신.' },
    { n: '코로나(팍스로비드·코미나티)·기타', r: 15, p: 10, c: 'bg-gray-400', note: '코로나 관련 매출은 계속 줄고 있다.' },
  ] },
  CNC: { basis: '2025년 사업 보고서', rows: [
    { n: '저소득층 보험(메디케이드)', r: 55, p: -20, c: 'bg-emerald-600', note: '주 정부 저소득층 보험 운영.' },
    { n: '개인 건강보험(오바마케어)', r: 25, p: 150, c: 'bg-red-500', note: '보험 가입자 질병 비율 상승으로 손실.' },
    { n: '노인 보험(메디케어)', r: 20, p: -30, c: 'bg-blue-600', note: '노인 정부 보험.' },
  ] },
  AES: { basis: '2025년 사업 보고서', rows: [
    { n: '재생 에너지 발전', r: 35, p: 40, c: 'bg-emerald-500', note: '데이터센터용 태양광·풍력 장기 계약.' },
    { n: '미국 전력 회사(인디애나·오하이오)', r: 30, p: 35, c: 'bg-amber-500', note: '전기 공급.' },
    { n: '해외 발전(남미 등)', r: 35, p: 25, c: 'bg-gray-500', note: '칠레·콜롬비아 발전.' },
  ] },
  SWKS: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '휴대폰 통신 칩(애플 등)', r: 65, p: 70, c: 'bg-gray-700', note: '아이폰 무선 신호 칩. 애플 의존도가 크다(쿼보와 합병 추진).' },
    { n: '기타(자동차·와이파이·인프라)', r: 35, p: 30, c: 'bg-blue-600', note: '자동차·와이파이 칩.' },
  ] },
  LYB: { basis: '2025년 사업 보고서', rows: [
    { n: '미주 플라스틱 원료', r: 35, p: -100, c: 'bg-blue-600', note: '폴리에틸렌. 미국 싼 가스 원료.' },
    { n: '유럽·아시아 플라스틱 원료', r: 30, p: 300, c: 'bg-gray-500', note: '원가 경쟁력이 떨어져 공장 매각 중.' },
    { n: '중간 화학제품·기술 라이선스', r: 25, p: -80, c: 'bg-emerald-500', note: '프로필렌옥사이드, 공정 기술 라이선스.' },
    { n: '정유', r: 10, p: -20, c: 'bg-red-600', note: '휴스턴 정유(폐쇄).' },
  ] },
  INTC: { basis: '2025년 사업 보고서', rows: [
    { n: 'PC 칩', r: 55, p: -40, c: 'bg-blue-600', note: '노트북·데스크톱 CPU. 그나마 버는 사업.' },
    { n: '서버 칩', r: 30, p: -10, c: 'bg-gray-600', note: '데이터센터 CPU(제온). AMD에 점유율을 뺏기는 중.' },
    { n: '파운드리(위탁 생산)', r: 15, p: 150, c: 'bg-red-600', note: '공장 짓는 데 큰돈을 써 매년 대규모 적자. 미국 정부가 지분 보유.' },
  ] },
  F: { basis: '2025년 사업 보고서', rows: [
    { n: '휘발유차(포드 블루)', r: 55, p: -30, c: 'bg-blue-700', u: [50000, '대', '자동차 한 대(평균)'], note: 'F-150 픽업·브롱코.' },
    { n: '전기차(모델 e)', r: 3, p: 220, c: 'bg-sky-400', note: '대당 수만 달러 손실.' },
    { n: '업무용 차(포드 프로)', r: 32, p: -60, c: 'bg-gray-600', note: '업무용 밴·트럭과 관리 서비스. 이익의 핵심.' },
    { n: '할부 금융(포드 크레딧)', r: 10, p: -30, c: 'bg-emerald-500', note: '차량 할부·리스.' },
  ] },
  MGM: { basis: '2025년 사업 보고서', rows: [
    { n: '라스베이거스 리조트', r: 50, p: 55, c: 'bg-amber-500', note: '벨라지오·MGM 그랜드 등.' },
    { n: '마카오 카지노', r: 25, p: 25, c: 'bg-red-600', note: 'MGM 차이나.' },
    { n: '미국 지역 카지노', r: 20, p: 20, c: 'bg-gray-500', note: '디트로이트 등.' },
    { n: '온라인 베팅(베트MGM)', r: 5, p: 0, c: 'bg-violet-500', note: '스포츠 베팅. 흑자 전환 중.' },
  ] },
  CVS: { basis: '2025년 사업 보고서', rows: [
    { n: '건강보험(에트나)', r: 35, p: 35, c: 'bg-violet-600', note: '노인·직장 건강보험.' },
    { n: '약제비 관리(케어마크)', r: 45, p: 35, c: 'bg-red-600', note: '보험사 대신 약값 협상·처리.' },
    { n: '약국·매장', r: 20, p: 30, c: 'bg-red-800', note: '약국 약 9,000곳. 점포 축소 중.' },
  ] },
  BEN: { basis: '2025 회계연도 사업 보고서', rows: [
    { n: '펀드 운용 수수료', r: 75, p: 80, c: 'bg-blue-700', note: '프랭클린·템플턴·레그메이슨 펀드. 자금 유출 지속.' },
    { n: '판매·기타 수수료', r: 25, p: 20, c: 'bg-gray-500', note: '펀드 판매 수수료(대부분 판매사로 나간다).' },
  ] },
  DVN: { basis: '2025년 사업 보고서', rows: [
    { n: '원유', r: 65, p: 75, c: 'bg-gray-800', u: [65, '배럴', '원유 1배럴'], note: '퍼미안·윌리스턴 셰일.' },
    { n: '천연가스·가스액', r: 35, p: 25, c: 'bg-blue-500', note: '같이 나오는 가스.' },
  ] },
  APA: { basis: '2025년 사업 보고서', rows: [
    { n: '미국 원유·가스', r: 55, p: 50, c: 'bg-gray-800', u: [65, '배럴', '원유 1배럴'], note: '퍼미안.' },
    { n: '이집트·북해', r: 45, p: 50, c: 'bg-amber-600', note: '이집트 가스, 영국 북해(축소).' },
  ] },
  BE: { basis: '2025년 사업 보고서', rows: [
    { n: '연료전지 발전기 판매', r: 75, p: 100, c: 'bg-emerald-600', note: '가스로 전기를 만드는 연료전지. 데이터센터 현장 발전 수요로 급성장.' },
    { n: '정비·전기 판매 계약', r: 25, p: 0, c: 'bg-gray-400', note: '설치 후 정비·전력 판매 계약.' },
  ] },
};

const SEGMENTS: Record<string, SegClock> = {
  AZO: {
    period: '2026 회계연도 4분기(2026년 5~8월, 16주)', days: 112, src: '2026-09-22 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '미국 일반 고객(직접 정비하는 운전자)', rev: 4.15e9, profit: 931.6e6 * 0.66, color: 'bg-orange-600', units: { n: 4.15e9 / 120, unit: '개', what: '자동차 배터리 한 개(약 $120)', value: true }, note: '배터리·브레이크 패드·오일을 사서 직접 고치는 사람들. 같은 매장 매출 +1.6%(전체 미국 기준).' },
      { name: '미국 정비소 납품', rev: 1.75e9, profit: 931.6e6 * 0.24, color: 'bg-red-500', note: '동네 정비소에 부품을 배달. 1년 매출 +11%로 가장 빨리 크는 사업. 이익률은 일반 고객보다 낮다.' },
      { name: '멕시코·브라질', rev: 0.70e9, profit: 931.6e6 * 0.10, color: 'bg-emerald-500', note: '같은 매장 매출 +10.7%(환율 빼면 +1.3%).' },
    ],
    facts: [
      { label: '매장 수', value: '8,031개', note: '1년에 374개를 새로 열었다(사상 최대).' },
      { label: '1년 매출', value: '203억 달러(+7.4%)', note: '분기 순이익 9.32억 달러(관세 환급 포함). 번 돈의 대부분으로 자사주를 사들여 주식 수를 계속 줄인다.' },
    ],
    how: '오토존은 사업부를 하나로 공개한다. 분기 매출(66억)과 순이익(9.32억 달러)은 실제 숫자이고, 일반 고객·정비소·해외 매출 비중은 예년 비율로 추정했다. 일반 고객 이익률이 가장 높은 점을 반영해 순이익을 66:24:10으로 나눴다(추정). "개"는 매출을 배터리 값으로 나눈 환산값.',
  },
  MTD: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026-07-30 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '실험실 장비(정밀 저울·분석기)', rev: 1.027e9 * 0.56, profit: 239e6 * 0.60, color: 'bg-blue-600', note: '0.0001g까지 재는 실험실 저울, pH 측정기, 피펫. 제약·화학 연구소 필수품. 소모품·정비 매출 비중이 높다.' },
      { name: '산업용 저울·제품 검사기', rev: 1.027e9 * 0.38, profit: 239e6 * 0.35, color: 'bg-gray-500', note: '공장 저울, 식품 포장 라인의 금속 이물질·무게 검사기.' },
      { name: '마트 저울', rev: 1.027e9 * 0.06, profit: 239e6 * 0.05, color: 'bg-amber-500', note: '마트 정육·과일 코너에서 무게를 재고 가격표를 뽑는 저울.' },
    ],
    facts: [
      { label: '분기 매출', value: '10.3억 달러(+4%)', note: '중국·신흥국 성장. 3분기 실적은 11월 초 발표 예정.' },
      { label: '주당순이익', value: '$11.55', note: '주식 수가 약 2,070만 주로 적어(자사주 매입) 주당 금액이 크다.' },
    ],
    how: '메틀러토레도는 지역별 사업부를 공개하고, 제품군별 매출 비중만 따로 낸다. 이번 분기 비중을 확인하지 못해 예년 비중(56:38:6)을 썼다. 순이익(주당 11.55달러 × 약 2,070만 주 ≈ 2.39억 달러)을 실험실 장비 이익률이 더 높은 점을 반영해 나눴다(추정).',
  },
  CMG: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026년 7월 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '매장 주문', rev: 3.3e9 * 0.65, profit: 0.45e9 * 0.68, color: 'bg-red-700', units: { n: 3.3e9 * 0.65 / 11.5, unit: '그릇', what: '부리토 볼(약 $11.50)', value: true }, note: '줄 서서 주문하는 매장 손님.' },
      { name: '앱·배달 주문', rev: 3.3e9 * 0.35, profit: 0.45e9 * 0.32, color: 'bg-amber-500', units: { n: 3.3e9 * 0.35 / 11.5, unit: '그릇', what: '부리토 볼(약 $11.50)', value: true }, note: '앱 주문, 차에서 받는 치포틀레인, 배달 앱 주문. 매출의 약 3분의 1.' },
    ],
    facts: [
      { label: '분기 매출', value: '33억 달러(+9.3%)', note: '같은 매장 매출 +2.2%. 새 매장 100개(80개는 차에서 받는 창구 있음).' },
      { label: '매장 단위 이익률', value: '25.2%', note: '매장 운영비를 뺀 이익(1년 전 27.4%). 3분기는 7월 식중독 사건 영향 예상.' },
    ],
    how: '치폴레는 사업부를 하나로 공개한다. 매출(33억 달러)은 실제 숫자이고, 앱·배달 비중(약 35%)은 예년 수준으로 잡았다. 순이익은 확인하지 못해 1년 전 수준(약 4.5억 달러)으로 추정했고, 배달 수수료 부담을 반영해 68:32로 나눴다(추정). "그릇"은 매출을 부리토 볼 값으로 나눈 환산값.',
  },
  FICO: {
    period: '2026 회계연도 3분기(2026년 4~6월)', days: 91, src: '2026-07-29 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '신용점수(FICO 스코어)', rev: 458.9e6, profit: 237.2e6 * 0.86, color: 'bg-blue-700', note: '은행이 대출 심사 때 조회하는 신용점수. 조회 1건마다 사용료를 받는다. 매출 +41%(주택담보대출 점수 가격 인상). 원가가 거의 없어 영업이익률 약 88%.' },
      { name: '금융사 소프트웨어', rev: 215.3e6, profit: 237.2e6 * 0.14, color: 'bg-gray-500', note: '은행의 사기 탐지·대출 결정 자동화 소프트웨어.' },
    ],
    facts: [
      { label: '분기 매출', value: '6.74억 달러(+26%)', note: '순이익 2.37억 달러. 매출 1달러당 35센트가 남는다.' },
      { label: '신용점수 이익 비중', value: '약 86%', note: '미국 대출 대부분이 FICO 점수를 쓴다. 대신 가격 인상에 대한 정부·업계 반발이 위험 요인.' },
    ],
    how: 'FICO는 두 사업의 매출과 영업이익을 공개한다. 신용점수 매출(4.59억)은 실제 숫자, 소프트웨어는 전체에서 뺀 값이다. 예년 영업이익률(점수 약 88%, 소프트웨어 약 30%)로 구한 비중(86:14)대로 순이익을 나눴다(추정).',
  },
  PAYX: {
    period: '2027 회계연도 1분기(2026년 6~8월)', days: 92, src: '2026-09-23 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '급여·인사 관리 소프트웨어', rev: 1213e6, profit: 429.7e6 * 0.81, color: 'bg-blue-600', note: '중소기업 직원 월급 계산·세금 신고·퇴직연금 관리. 매출 +4%.' },
      { name: '인사 대행(PEO)·보험', rev: 367.6e6, profit: 429.7e6 * 0.11, color: 'bg-emerald-500', note: '중소기업 직원을 서류상 페이첵스가 고용해 건강보험·급여를 대신 처리. 매출 +12%. 보험료가 매출에 섞여 이익률이 낮다.' },
      { name: '고객 급여 자금 이자', rev: 49.9e6, profit: 429.7e6 * 0.08, color: 'bg-amber-500', note: '고객 회사가 월급 지급 전에 맡긴 돈을 잠깐 굴려 받는 이자. 비용이 없어 거의 다 이익.' },
    ],
    facts: [
      { label: '분기 매출', value: '16.3억 달러(+6%)', note: '순이익 4.30억 달러(+12%).' },
      { label: '매출 1달러당 순이익', value: '약 26센트', note: '순이익 4.30억 ÷ 매출 16.3억 달러.' },
    ],
    how: '페이첵스는 두 사업과 이자 수입을 따로 공개한다(이자는 전체에서 두 사업을 뺀 값). 사업별 이익은 공개하지 않아 예년 이익률(급여 관리 약 45%, 인사 대행 약 20%, 이자 거의 100%)로 순이익을 81:11:8로 나눴다(추정).',
  },
  GRMN: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026년 7월 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '스마트워치(피트니스)', rev: 756.8e6, profit: 0.55e9 * 277.0 / 615.5, color: 'bg-sky-500', units: { n: 756.8e6 / 450, unit: '개', what: '포러너 러닝 시계(약 $450)', value: true }, note: '러닝·건강 시계, 자전거 속도계. 매출의 37%. 영업이익 2.77억 달러.' },
      { name: '아웃도어(등산·다이빙 시계)', rev: 482.7e6, profit: 0.55e9 * 163.6 / 615.5, color: 'bg-emerald-600', note: '페닉스 같은 고급 아웃도어 시계, 위성 통신기. 영업이익률 34%.' },
      { name: '선박용 장비', rev: 341.4e6, profit: 0.55e9 * 99.8 / 615.5, color: 'bg-blue-700', note: '어군 탐지기, 선박 내비게이션.' },
      { name: '항공기 장비', rev: 268.7e6, profit: 0.55e9 * 72.2 / 615.5, color: 'bg-gray-500', note: '소형 비행기·헬기 조종석 화면과 자동 조종 장치.' },
      { name: '자동차 화면(납품)', rev: 172.4e6, profit: 0.55e9 * 2.9 / 615.5, color: 'bg-amber-500', note: '자동차 회사에 납품하는 차량 화면 시스템. 거의 남지 않는다.' },
    ],
    facts: [
      { label: '분기 매출', value: '20.2억 달러', note: '영업이익 6.16억 달러(이익률 30%).' },
      { label: '가장 남는 사업', value: '아웃도어', note: '매출 대비 영업이익 34%. 자동차 화면은 2% 미만.' },
    ],
    how: '가민은 다섯 사업의 매출과 영업이익을 공개한다(위 금액 모두 실제). 순이익은 확인하지 못해 영업이익 × 약 0.89(이자 수입 더하고 세금 뺀 예년 비율) ≈ 5.5억 달러로 잡고 영업이익 비중대로 나눴다(추정). 3분기 실적은 10월 말 발표 예정.',
  },
  ZTS: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026-08-06 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '미국', rev: 1.3e9, profit: 691e6 * 0.59, color: 'bg-blue-600', note: '반려동물 약(진드기·관절염·피부병)과 소·돼지 백신. 매출 −7%, 반려동물 약 판매 −11%로 부진.' },
      { name: '해외', rev: 1.2e9, profit: 691e6 * 0.41, color: 'bg-emerald-500', note: '매출 +8%. 반려동물 진드기 약 심파리카 트리오가 이끌었다.' },
    ],
    facts: [
      { label: '분기 매출', value: '25억 달러(제자리)', note: '1년 매출 전망을 낮췄다(91.2억~93.2억 달러).' },
      { label: '매출 1달러당 순이익', value: '약 28센트', note: '순이익 6.91억 ÷ 매출 25억 달러.' },
    ],
    how: '조에티스는 미국과 해외 두 사업부의 매출과 사업이익을 공개한다. 이번 분기 사업이익을 확인하지 못해 예년 비중(미국 이익률이 더 높음)으로 순이익(6.91억 달러)을 59:41로 나눴다(추정). 3분기 실적은 11월 초 발표 예정.',
  },
  MSI: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026-08-05 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '무전기·통신망·보안 카메라', rev: 1908e6, profit: 559e6 * 453 / 809, color: 'bg-blue-700', note: '경찰·소방용 무전기와 전용 통신망, 보안 카메라·출입 통제. 매출 +15%, 영업이익 4.53억 달러.' },
      { name: '소프트웨어·유지보수', rev: 1225e6, profit: 559e6 * 356 / 809, color: 'bg-emerald-500', note: '911 신고 접수 소프트웨어, 무전망 유지보수 계약. 매출 +10%, 영업이익 3.56억 달러. 계약 기간이 길어 안정적.' },
    ],
    facts: [
      { label: '수주 잔고', value: '156억 달러(+11%)', note: '이미 계약했지만 아직 매출로 잡히지 않은 일감. 분기 매출의 5배.' },
      { label: '분기 매출', value: '31.3억 달러(+13%)', note: '관세 환급 6천만 달러 포함.' },
    ],
    how: '모토로라솔루션스는 두 사업의 매출과 영업이익을 공개한다. 순이익(주당 3.33달러 × 약 1.68억 주 ≈ 5.6억 달러)을 사업별 영업이익(4.53억 : 3.56억 달러) 비중대로 나눴다.',
  },
  TYL: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026년 7월 회사 실적 발표', profitLabel: '조정 순이익(추정)',
    rows: [
      { name: '클라우드 구독(SaaS)', rev: 230.6e6, profit: 134e6 * 0.40, color: 'bg-sky-500', note: '시·군·법원이 쓰는 세금·재판·공공요금 관리 소프트웨어를 클라우드로 빌려준다. 매출 +21.7%, 21분기 연속 20% 넘게 성장.' },
      { name: '결제·전자 신청 수수료', rev: 190e6, profit: 134e6 * 0.30, color: 'bg-emerald-500', note: '시민이 온라인으로 벌금·세금을 내거나 서류를 낼 때마다 받는 건당 수수료(추정 금액).' },
      { name: '유지보수·설치 서비스 등', rev: 224.5e6, profit: 134e6 * 0.30, color: 'bg-gray-400', note: '예전 방식(직접 설치) 소프트웨어 유지보수, 설치·교육 서비스, 라이선스 판매. 클라우드로 옮기며 줄어드는 중.' },
    ],
    facts: [
      { label: '분기 매출', value: '6.45억 달러(+8.2%)', note: '3분기 실적은 10월 28일 발표 예정.' },
      { label: '조정 주당순이익', value: '$3.08', note: '인수 관련 상각 등을 뺀 값.' },
    ],
    how: '타일러는 사업부를 거의 하나로 공개하고 매출 종류만 나눈다. 클라우드 구독(2.31억)은 실제 숫자이고, 결제 수수료는 예년 비중으로 추정, 나머지는 전체에서 뺀 값이다. 조정 순이익(주당 3.08달러 × 약 4,350만 주 ≈ 1.34억 달러)을 이익률이 높은 클라우드에 더 많이 배분했다(추정).',
  },
  APH: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026-07-29 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '통신·데이터센터 연결 부품', rev: 5.4e9, profit: 1.77e9 * 0.67, color: 'bg-violet-600', note: 'AI 서버 안의 고속 케이블·커넥터, 통신 장비 부품. 매출 +85%(인수 포함). 영업이익률 33.6%.' },
      { name: '군사·항공·산업용 부품', rev: 1.9e9, profit: 1.77e9 * 0.21, color: 'bg-emerald-600', note: '전투기·인공위성·공장 장비에 쓰는 튼튼한 커넥터. 매출 +28%. 영업이익률 30.1%.' },
      { name: '자동차·센서 부품', rev: 1.5e9, profit: 1.77e9 * 0.12, color: 'bg-amber-500', note: '자동차 배선 커넥터·센서. 매출 +17%. 영업이익률 21%.' },
    ],
    facts: [
      { label: '분기 매출', value: '88억 달러(+55%)', note: '인수 효과를 빼도 +30%. AI 데이터센터 투자 수혜.' },
      { label: '매출 1달러당 순이익', value: '약 20센트', note: '순이익 17.7억 ÷ 매출 88억 달러.' },
    ],
    how: '암페놀은 세 사업의 매출과 영업이익률을 공개한다. 사업별 영업이익(약 18.1억 : 5.7억 : 3.2억 달러) 비중(67:21:12)대로 순이익(17.7억 달러)을 나눴다. 3분기 실적은 10월 28일 발표 예정.',
  },
  AXON: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026-08-05 회사 실적 발표', profitLabel: '조정 순이익(추정)',
    rows: [
      { name: '테이저·바디캠·드론 방어 장비', rev: 507e6, profit: 155e6 * 0.40, color: 'bg-yellow-500', note: '전기 충격기 테이저 10, 경찰 몸에 다는 카메라, 드론 탐지·차단 장비. 매출 +35%.' },
      { name: '소프트웨어·클라우드', rev: 398e6, profit: 155e6 * 0.60, color: 'bg-sky-500', note: '영상 증거 저장 클라우드, AI 보고서 작성 등 경찰용 소프트웨어 구독. 매출 +36%. 이익률이 더 높다.' },
    ],
    facts: [
      { label: '분기 매출', value: '9.04억 달러(+35%)', note: '10분기 연속 30% 넘게 성장.' },
      { label: '장부상 순이익', value: '약 2,900만 달러', note: '주식 보상 비용이 커서 작다. 위 표는 이를 뺀 조정 순이익(1.55억 달러) 기준.' },
    ],
    how: '액손은 두 사업의 매출을 공개한다. 장부상 순이익은 직원 주식 보상 비용 때문에 작아서, 이를 뺀 조정 순이익(1.55억 달러)을 소프트웨어 이익률이 더 높은 점을 반영해 40:60으로 나눴다(추정).',
  },
  VRTX: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026-08-03 회사 실적 발표', profitLabel: '조정 순이익(추정)',
    rows: [
      { name: '트리카프타(낭포성 섬유증 약)', rev: 2.50e9, profit: 1.42e9 * 2.50 / 3.20, color: 'bg-red-600', note: '폐에 끈적한 점액이 차는 유전병 치료제. 회사 매출의 75%. 환자들이 새 약(알리프트렉)으로 옮겨 −2%.' },
      { name: '알리프트렉(새 낭포성 섬유증 약)', rev: 573.6e6, profit: 1.42e9 * 0.5736 / 3.20, color: 'bg-orange-500', note: '하루 한 번 먹는 차세대 약. 상반기에만 10억 달러 넘게 팔렸다.' },
      { name: '기타 낭포성 섬유증 약', rev: 130e6, profit: 1.42e9 * 0.13 / 3.20, color: 'bg-rose-300', note: '칼리데코 등 예전 약(추정 금액).' },
      { name: '새 분야(진통제 저나벡스·유전자 치료 카스게비)', rev: 126e6, profit: -0.2e9, color: 'bg-sky-500', note: '마약성이 아닌 진통제 저나벡스(4,960만, 4배 성장), 겸상 적혈구병 유전자 치료 카스게비(7,640만 달러). 아직 판매 비용이 커서 손실(추정).' },
    ],
    facts: [
      { label: '분기 매출', value: '33.3억 달러(+12%)', note: '1년 매출 전망 131억~132억 달러로 올림.' },
      { label: '조정 주당순이익', value: '$4.73', note: '인수 관련 비용 등을 뺀 값. 3분기는 인수 비용 때문에 장부상 손실 예상(11월 2일 발표).' },
    ],
    how: '버텍스는 사업부를 하나로 공개하고 약별 매출만 낸다. 위 약 매출은 실제 숫자(기타 낭포성 섬유증 약만 추정). 조정 순이익(주당 4.73달러 × 약 2.58억 주 ≈ 12.2억 달러) 중 새 분야는 손실 약 2억 달러로 보고, 나머지(14.2억)를 낭포성 섬유증 약 매출 비중대로 나눴다(추정).',
  },
  BSX: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026-07-29 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '심장·혈관 시술 기구', rev: 3.62e9, profit: 907e6 * 0.65, color: 'bg-red-600', note: '심장 부정맥을 고치는 펄스 시술 기구 파라펄스, 뇌졸중 예방용 심장 마개 왓치맨, 스텐트 등. 매출 +8.3%. 왓치맨 성장이 꺾여 전망을 낮췄다.' },
      { name: '내시경·비뇨기·신경 조절 기구', rev: 1.82e9, profit: 907e6 * 0.35, color: 'bg-sky-500', note: '내시경 시술 기구, 요로 결석 제거, 통증 완화용 신경 자극기 등. 매출 +5.9%.' },
    ],
    facts: [
      { label: '분기 매출', value: '54.4억 달러(+7.5%)', note: '3분기는 8월 말 해킹 사고로 목표 미달 예고.' },
      { label: '매출 1달러당 순이익', value: '약 17센트', note: '순이익 9.07억 ÷ 매출 54.4억 달러.' },
    ],
    how: '보스턴사이언티픽은 두 사업의 매출과 영업이익을 공개한다. 이번 분기 영업이익을 확인하지 못해 예년 이익률(두 사업 비슷, 약 30%)로 순이익(9.07억 달러)을 65:35로 나눴다(추정).',
  },
  DE: {
    period: '2026 회계연도 3분기(2026년 5~7월)', days: 91, src: '2026-08-20 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '대형 농기계(트랙터·콤바인)', rev: 3.998e9, profit: 1.16e9 * 527 / 1585, color: 'bg-green-600', units: { n: 3.998e9 / 500e3, unit: '대', what: '대형 트랙터(약 $50만)', value: true }, note: '대규모 농장용 트랙터·콤바인·자율주행 장비. 곡물 값이 낮아 매출 −6%, 영업이익 5.27억 달러(−9%).' },
      { name: '소형 농기계·잔디 깎기', rev: 3.38e9, profit: 1.16e9 * 622 / 1585, color: 'bg-lime-500', units: { n: 3.38e9 / 3500, unit: '대', what: '잔디 깎기 트랙터(약 $3,500)', value: true }, note: '축산·소규모 농가용 트랙터, 가정용 잔디 깎기. 매출 +12%, 영업이익 6.22억 달러(+28%).' },
      { name: '건설·임업 장비', rev: 3.62e9, profit: 1.16e9 * 436 / 1585, color: 'bg-yellow-500', note: '굴착기·로더·도로 장비(비르트겐). 매출 +18%, 영업이익 4.36억 달러(+84%).' },
      { name: '할부 금융', rev: 1.4e9, profit: 219e6, color: 'bg-gray-500', note: '장비를 사는 농부·건설사에 돈을 빌려주고 이자를 받는다. 순이익 2.19억 달러(+7%). 매출은 추정.' },
    ],
    facts: [
      { label: '장비 매출', value: '110억 달러(+6%)', note: '거의 3년 만에 이익이 1년 전보다 늘었다. 회사는 2026년을 농기계 경기 바닥으로 본다.' },
      { label: '분기 순이익', value: '13.8억 달러', note: '할부 금융 2.19억 포함.' },
    ],
    how: '디어는 세 장비 사업의 매출·영업이익과 할부 금융 순이익을 공개한다. 할부 금융 순이익(2.19억)은 실제 숫자이고, 나머지 순이익(11.6억 달러)을 세 장비 사업의 영업이익 비중대로 나눴다. 할부 금융 매출은 예년 수준 추정. "대"는 매출을 대표 장비 가격으로 나눈 환산값.',
  },
  BLK: {
    period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-14 회사 실적 발표', profitLabel: '조정 순이익(추정)',
    rows: [
      { name: '운용 기본 수수료(아이셰어즈 ETF 등)', rev: 6.15e9, profit: 2.62e9 * 0.80, color: 'bg-gray-800', note: '맡긴 돈(15.5조 달러)의 일정 비율을 해마다 받는다. ETF·연기금·사모 대출(HPS) 등. +19%. 주가가 오르면 맡긴 돈이 늘어 수수료도 는다.' },
      { name: '성과 수수료', rev: 630e6, profit: 2.62e9 * 0.06, color: 'bg-amber-500', note: '사모펀드·헤지펀드가 목표 수익을 넘기면 받는 보너스(+22%). 해마다 크게 출렁인다. 직원 성과급으로 많이 나가 이익률이 낮다.' },
      { name: '알라딘(투자 관리 소프트웨어)', rev: 520e6, profit: 2.62e9 * 0.09, color: 'bg-sky-500', note: '다른 운용사·은행에 빌려주는 위험 관리 시스템. 매출 +14%. 구독이라 안정적.' },
      { name: '기타(유통·자문 등)', rev: 450e6, profit: 2.62e9 * 0.05, color: 'bg-gray-400', note: '펀드 판매 수수료, 자문 수수료 등(추정 금액).' },
    ],
    facts: [
      { label: '맡은 돈', value: '15.5조 달러', note: '세계 최대 운용사. 이번 분기에만 아이셰어즈 ETF로 1,345억 달러가 새로 들어왔다.' },
      { label: '조정 영업이익률', value: '47.8%', note: '조정 순이익 26.2억 달러, 장부상 순이익 16.6억 달러(인수 관련 비용 포함).' },
    ],
    how: '블랙록은 사업부를 하나로 공개하고 매출 종류만 나눈다. 성과 수수료(6.3억)는 실제 숫자이고, 알라딘·기타 매출은 예년 비중으로, 기본 수수료는 전체(77.5억)에서 나머지를 뺀 값이다. 인수 관련 비용을 뺀 조정 순이익(26.2억 달러)을 매출 비중에 이익률 차이를 반영해 나눴다(추정).',
  },
  CL: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026-07-31 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '치약·칫솔·비누·세제', rev: 4.166e9, profit: 693e6 * 0.78, color: 'bg-red-600', units: { n: 4.166e9 / 3, unit: '개', what: '콜게이트 치약 한 개(약 $3)', value: true }, note: '세계 치약 시장 40%. 파몰리브 주방 세제, 소프트소프 비누 등.' },
      { name: '반려동물 사료(힐스)', rev: 1.195e9, profit: 693e6 * 0.22, color: 'bg-amber-600', units: { n: 1.195e9 / 80, unit: '포대', what: '힐스 사료 큰 포대(약 $80)', value: true }, note: '수의사가 권하는 처방 사료. 매출 +3.4%, 영업이익 2.69억 달러(이익률 22.5%).' },
    ],
    facts: [
      { label: '분기 매출', value: '53.6억 달러(+4.9%)', note: '3분기 실적은 10월 말 발표 예정.' },
      { label: '매출 1달러당 순이익', value: '약 13센트', note: '순이익 6.93억 ÷ 매출 53.6억 달러(구조조정 비용 포함).' },
    ],
    how: '콜게이트는 생활용품(지역별 4개)과 힐스 사업의 매출·영업이익을 공개한다. 힐스 영업이익(2.69억)은 실제 숫자이고, 생활용품 영업이익은 예년 이익률(약 24%)로 잡아 순이익(6.93억 달러)을 78:22로 나눴다(추정). "개·포대"는 매출을 소매가로 나눈 환산값.',
  },
  ECL: {
    period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-27 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '산업용 수처리·세정', rev: 2.45e9, profit: 551.3e6 * 0.48, color: 'bg-blue-600', note: '공장·발전소·데이터센터 냉각수 처리(날코 워터), 식품 공장 세정, 반도체 공장용 초순수. 데이터센터 냉각(쿨잇) 인수로 커졌다.' },
      { name: '식당·호텔 위생', rev: 1.48e9, profit: 551.3e6 * 0.36, color: 'bg-emerald-500', note: '식당 식기세척기 세제, 호텔 세탁·청소 약품. 장비를 빌려주고 약품을 계속 판다.' },
      { name: '병원·제약 위생', rev: 0.43e9, profit: 551.3e6 * 0.08, color: 'bg-sky-500', note: '병원 소독제, 제약 공장 무균 세정.' },
      { name: '해충 방제', rev: 0.33e9, profit: 551.3e6 * 0.08, color: 'bg-amber-600', note: '식당·호텔·식품 공장 해충 관리 서비스.' },
    ],
    facts: [
      { label: '분기 매출', value: '46.9억 달러(+13%)', note: '인수 효과 빼면 +7%. 디지털 서비스 매출 1.29억 달러(+34%).' },
      { label: '매출 1달러당 순이익', value: '약 12센트', note: '순이익 5.51억 ÷ 매출 46.9억 달러(인수 관련 상각·이자 증가로 −6%).' },
    ],
    how: '에코랩은 네 사업의 매출과 영업이익을 공개하지만 이번 분기 금액을 확인하지 못했다. 예년 비중에 최근 인수(산업용)를 반영해 매출을 나누고, 예년 이익률(산업용 약 18%, 식당·호텔 약 22%, 병원·제약 약 18%, 해충 방제 약 22%)로 순이익(5.51억 달러)을 나눴다(추정).',
  },
  MAR: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026-08-03 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '브랜드 사용료(가맹)', rev: 1023e6, profit: 766e6 * 0.63, color: 'bg-red-700', units: { n: 1.75e6 * 0.72 * 91, unit: '박', what: '메리어트 계열 호텔 객실 1박(추정)' }, note: '호텔 주인이 "메리어트·코트야드·쉐라톤" 이름과 예약 시스템을 쓰는 대가로 객실 매출의 일정 비율을 낸다. 신용카드 제휴 수수료도 여기에 들어간다. 돈 들 일이 거의 없다.' },
      { name: '위탁 운영 기본 수수료', rev: 343e6, profit: 766e6 * 0.21, color: 'bg-amber-500', note: '메리어트가 호텔 운영을 맡아 주고 매출의 일정 비율을 받는다.' },
      { name: '위탁 운영 성과 수수료', rev: 212e6, profit: 766e6 * 0.13, color: 'bg-emerald-500', note: '맡은 호텔이 정해진 이익을 넘기면 추가로 받는 돈(+6%). 경기가 좋을 때 크게 늘어난다.' },
      { name: '직접 소유·임차 호텔(비용 뺀 값)', rev: 49e6, profit: 766e6 * 0.03, color: 'bg-gray-400', note: '소수의 직영 호텔에서 비용을 빼고 남은 돈. 소송 비용으로 1년 전(7,800만 달러)보다 줄었다.' },
    ],
    facts: [
      { label: '수수료 매출', value: '15.8억 달러(+13%)', note: '호텔 직원 급여 등 "대신 내고 돌려받는 돈"을 뺀 실제 벌이.' },
      { label: '1박당 순이익(추정)', value: '약 $6.7', note: '순이익 7.66억 ÷ 약 1.15억 박. 건물 없이 이름과 예약 시스템으로 번다.' },
    ],
    how: '메리어트는 지역별 사업부를 공개하고, 수수료 종류별 금액을 따로 낸다. 위 네 금액은 실제 숫자다. 호텔 비용을 대신 내고 돌려받는 돈(이익 0)은 표에서 뺐다. 본사 비용·이자를 빼고 남은 순이익(7.66억 달러)을 수수료 비중에 맞춰 나눴다(추정). "박"은 객실 약 175만 개 × 점유율 약 72% × 91일로 계산한 추정값.',
  },
  FAST: {
    period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-14 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '나사·볼트 등 고정 부품', rev: 2463.3e6 * 0.307, profit: 401.6e6 * 0.34, color: 'bg-gray-600', note: '회사 이름(패스너 = 고정 부품)의 원래 사업. 공장 생산 라인에 들어가는 부품이 많다. 이익률이 다른 제품보다 높다.' },
      { name: '안전용품(장갑·보안경 등)', rev: 2463.3e6 * 0.21, profit: 401.6e6 * 0.19, color: 'bg-amber-500', note: '공장 안 자판기에서 직원이 꺼내 쓰는 장갑·마스크·보안경 등.' },
      { name: '공구·청소용품 등 기타', rev: 2463.3e6 * 0.483, profit: 401.6e6 * 0.47, color: 'bg-sky-500', note: '절삭 공구·연마재·전동 공구·청소용품·포장재 등 여러 제품군.' },
    ],
    facts: [
      { label: '하루 매출', value: '3,850만 달러(+15.5%)', note: '영업일 64일 기준. 공장이 쉬는 주말엔 거의 팔리지 않는다.' },
      { label: '매출 1달러당 순이익', value: '약 16센트', note: '순이익 4.02억 ÷ 매출 24.6억 달러.' },
    ],
    how: '패스널은 사업부를 하나로 공개하고 제품군별 매출 비중만 낸다. 3분기 비중을 찾지 못해 2분기 비중(고정 부품 30.7%, 안전용품 21.0%)을 썼다. 고정 부품의 이익률이 더 높다는 회사 설명을 반영해 순이익(4.02억 달러)을 34:19:47로 나눴다(추정).',
  },
  PM: {
    period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-21 회사 실적 발표', profitLabel: '조정 순이익(추정)',
    rows: [
      { name: '일반 담배(말보로 등)', rev: 11.4e9 * 0.59, profit: 3.67e9 * 0.55, color: 'bg-red-700', units: { n: 158.0e9, unit: '개비', what: '일반 담배 출하(실제)' }, note: '출하량 제자리(업계 전체는 −1.1%). 가격을 올려 매출은 +6.4%.' },
      { name: '연기 없는 제품(아이코스·진)', rev: 11.4e9 * 0.41, profit: 3.67e9 * 0.45, color: 'bg-sky-500', units: { n: 41.5e9, unit: '개', what: '아이코스 가열 담배 스틱 출하(실제)' }, note: '매출의 41%. 매출 +4.1%. 아이코스 스틱 415억 개(+1.5%), 미국 니코틴 파우치 진(ZYN) 32억 개(+4.2%).' },
    ],
    facts: [
      { label: '담배 1개비(환산)당 매출', value: '약 5.5센트', note: '매출 114억 ÷ 출하 2,062억 개(일반 담배·가열 담배 등 합계). 세금은 뺀 값.' },
      { label: '조정 주당순이익', value: '$2.36(+5.4%)', note: '보유 주식 평가 손실 같은 비현금 항목을 뺀 값. 장부상 $2.12.' },
    ],
    how: '필립모리스는 지역별 사업부를 공개하고, 일반 담배와 연기 없는 제품의 매출은 따로 낸다. 매출 비중(약 59:41)은 확인했지만 제품별 이익은 공개하지 않는다. 연기 없는 제품의 이익률이 더 높다는 회사 설명을 반영해 조정 순이익(주당 2.36달러 × 약 15.6억 주 ≈ 36.7억 달러)을 55:45로 나눴다(추정). 판매 개수는 실제 출하량.',
  },
  MNST: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026-08-06 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '몬스터 에너지', rev: 2.36e9, profit: 584.5e6 * 0.94, color: 'bg-lime-500', units: { n: 2.36e9 / 2.68, unit: '캔', what: '몬스터 캔(소매가 약 $2.68)', value: true }, note: '몬스터·레인 등. 매출 +21.6%. 해외 매출이 +35%로 빠르게 커서 전체의 46%.' },
      { name: '기타 에너지 음료(코카콜라에서 인수)', rev: 143.7e6, profit: 584.5e6 * 0.05, color: 'bg-red-500', note: '리라이언트·NOS·풀스로틀, 신흥국용 저가 브랜드 프레데터·퓨리. 매출 +10.6%.' },
      { name: '맥주·주류', rev: 32.2e6, profit: 584.5e6 * 0.01, color: 'bg-amber-600', note: '수제 맥주 회사를 인수해 시작했지만 매출 −15%로 부진.' },
    ],
    facts: [
      { label: '분기 매출', value: '25.4억 달러(+20%)', note: '순이익 5.85억 달러(+19.6%).' },
      { label: '매출 1달러당 순이익', value: '약 23센트', note: '순이익 5.85억 ÷ 매출 25.4억 달러.' },
    ],
    how: '몬스터는 세 사업의 매출과 영업이익을 공개하지만 이번 분기 영업이익을 확인하지 못했다. 몬스터 에너지 이익률이 가장 높고 주류는 거의 남지 않는 점(예년 기준)을 반영해 순이익을 94:5:1로 나눴다(추정). "캔"은 회사 매출을 소매가로 나눈 환산값이라 실제 판매량은 더 많다(회사는 유통사에 더 싸게 넘긴다).',
  },
  HLT: {
    period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-27 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '브랜드 사용료·위탁 운영 수수료', rev: 0.97e9, profit: 536e6 * 0.92, color: 'bg-blue-700', units: { n: 1.33e6 * 0.74 * 92, unit: '박', what: '힐튼 계열 호텔 객실 1박(추정)' }, note: '호텔 주인이 "힐튼" 이름을 쓰고 운영을 맡기는 대가로 객실 매출의 일정 비율을 낸다. 수수료 +9.5%. 돈 들 일이 거의 없어 대부분 이익.' },
      { name: '직접 소유·임차 호텔', rev: 0.33e9, profit: 536e6 * 0.04, color: 'bg-amber-500', note: '힐튼이 직접 가진 소수의 호텔. 매출은 크지만 인건비·임대료가 들어 이익률이 낮다.' },
      { name: '기타(신용카드 제휴 등)', rev: 0.058e9, profit: 536e6 * 0.04, color: 'bg-emerald-500', note: '아멕스 힐튼 카드 제휴 수수료 등.' },
      { name: '호텔 비용 대신 내고 돌려받는 돈', rev: 1.967e9, profit: 0, color: 'bg-gray-300', note: '호텔 직원 급여·마케팅비를 힐튼이 먼저 내고 호텔 주인에게 그대로 돌려받는 돈. 매출에 잡히지만 이익은 0.' },
    ],
    facts: [
      { label: '객실 1개당 매출 성장', value: '+5.8%', note: '판매 가능 객실당 매출(객실 점유율 × 평균 객실 요금).' },
      { label: '1박당 순이익(추정)', value: '약 $6', note: '순이익 5.36억 ÷ 약 9천만 박. 힐튼은 호텔 건물 없이 이름과 예약 시스템으로 번다.' },
    ],
    how: '힐튼은 위탁 운영·브랜드 사업과 소유 호텔 사업의 매출과 이익을 공개한다. 이번 분기 전체 매출(33.3억)과 "돌려받는 돈"을 뺀 매출(13.6억 달러)은 확인했고, 그 안의 나눔은 예년 비중으로 잡았다. 순이익(5.36억 달러)을 92:4:4로 나눴다(추정). "박"은 객실 약 133만 개 × 점유율 약 74% × 92일로 계산한 추정값.',
  },
  MSCI: {
    period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-20 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '주가지수(MSCI 지수)', rev: 532.6e6, profit: 351e6 * 0.74, color: 'bg-blue-700', note: '전 세계 펀드·ETF가 따라가는 지수를 만들고 사용료를 받는다. 그중 2.47억 달러(+25%)는 지수를 따르는 ETF 자산 규모에 비례해 받는 돈이라 주가가 오르면 같이 는다.' },
      { name: '위험 분석 소프트웨어', rev: 172e6, profit: 351e6 * 0.17, color: 'bg-violet-500', note: '운용사가 포트폴리오 위험을 재는 도구.' },
      { name: '친환경·기후 평가', rev: 93.7e6, profit: 351e6 * 0.05, color: 'bg-emerald-500', note: '기업의 환경·사회·지배구조 점수와 기후 위험 데이터. 매출 +4%로 성장이 느려졌다.' },
      { name: '비상장 자산 데이터', rev: 93.7e6, profit: 351e6 * 0.04, color: 'bg-amber-500', note: '사모펀드·부동산 성과 데이터(버고브·IPD 등).' },
    ],
    facts: [
      { label: '영업이익률', value: '56.3%', note: '매출 100달러 중 56달러가 영업이익. 지수 사업은 70%가 넘는다.' },
      { label: '분기 매출', value: '8.92억 달러(+12.4%)', note: '순이익 3.51억 달러(+7.9%).' },
    ],
    how: 'MSCI는 네 사업의 매출과 조정 영업이익(EBITDA)을 공개한다. 지수(5.33억)·친환경(0.94억 달러) 매출은 확인했고, 나머지 2.66억 달러는 예년 비중으로 위험 분석과 비상장 자산 데이터에 나눴다. 순이익(3.51억 달러)은 예년 사업별 이익률(지수 약 76%, 위험 분석 약 52%, 친환경 약 30%, 비상장 약 25%)로 구한 이익 비중대로 나눴다(추정).',
  },
  ITW: {
    period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-27 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '시험·측정·전자', rev: 819e6, profit: 855e6 * 235 / 1183, color: 'bg-violet-500', note: '재료 강도 시험기·반도체 장비 부품 등. 매출 +17%로 가장 빨리 큼. 영업이익률 28.7%.' },
      { name: '자동차 부품', rev: 814e6, profit: 855e6 * 164 / 1183, color: 'bg-gray-500', note: '자동차 회사에 납품하는 플라스틱·금속 부품. 매출 −2%(유럽 −7%). 영업이익률 20.1%로 가장 낮다.' },
      { name: '주방 설비(호바트)', rev: 698e6, profit: 855e6 * 208 / 1183, color: 'bg-red-500', note: '식당·병원용 식기세척기·오븐·냉장고. 매출 +1%, 영업이익률 29.8%.' },
      { name: '용접 장비(밀러)', rev: 513e6, profit: 855e6 * 186 / 1183, color: 'bg-amber-500', note: '매출 +7%. 영업이익률 36.3%로 가장 남는 사업. 7월 토네이도로 공장 두 곳이 피해(보험으로 대부분 보전).' },
      { name: '접착제·윤활유 등', rev: 477e6, profit: 855e6 * 124 / 1183, color: 'bg-emerald-500', note: '산업용 접착제·자동차 관리 용품(레인엑스 등). 매출 +8%.' },
      { name: '건축 자재·특수 제품', rev: 919e6, profit: 855e6 * 266 / 1183, color: 'bg-sky-500', note: '못·나사·고정 장치, 포장 장비 등 두 사업 합계.' },
    ],
    facts: [
      { label: '영업이익률', value: '27.8%(사상 최고)', note: '분기 영업이익 11.8억 달러.' },
      { label: '배당', value: '연 $6.88(+7%)', note: '이번 발표 때 올렸다. 순이익 8.55억 달러.' },
    ],
    how: 'ITW는 일곱 사업의 매출과 영업이익을 공개한다. 다섯 사업은 이번 분기 매출·이익률을 확인했고, 건축 자재와 특수 제품은 전체에서 나머지를 뺀 매출에 이익률 약 29%를 적용했다(접착제·윤활유 이익률도 약 26%로 추정). 이렇게 구한 영업이익 합계(11.8억)가 회사 발표와 맞는다. 순이익(8.55억 달러)을 영업이익 비중대로 나눴다.',
  },
  VRSK: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026-07-29 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '보험 가입 심사 데이터', rev: 569e6, profit: 229e6 * 0.74, color: 'bg-blue-600', note: '보험사가 보험료를 정할 때 쓰는 표준 약관·사고 통계·재해 위험 모델. 미국 보험사 대부분이 쓴다. 매출 +3.5%.' },
      { name: '보험금 청구 처리 소프트웨어', rev: 237e6, profit: 229e6 * 0.26, color: 'bg-emerald-500', note: '자동차 수리비 견적·보험 사기 탐지 등. 매출 +6.3%.' },
    ],
    facts: [
      { label: '분기 매출', value: '8.06억 달러(+4.3%)', note: '3분기 실적은 아직 발표 전.' },
      { label: '매출 1달러당 순이익', value: '약 28센트', note: '순이익 2.29억 ÷ 매출 8.06억 달러(세금·이자·소송 비용 증가로 −9.8%).' },
    ],
    how: '버리스크는 두 사업의 매출을 공개하지만 이익은 나누지 않는다. 가입 심사 데이터의 이익률이 더 높은 점(예년 기준)을 반영해 순이익(2.29억 달러)을 74:26으로 나눴다(추정).',
  },
  TT: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026-07-30 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '아메리카(미국·캐나다·중남미)', rev: 5271.3e6, profit: 925.7e6 * 0.85, color: 'bg-blue-600', note: '빌딩·데이터센터용 대형 냉방기(칠러), 가정용 에어컨, 냉장 트럭(서모킹). 매출 +12%, 수주 +43%(데이터센터 효과).' },
      { name: '유럽·중동·아프리카', rev: 697.6e6, profit: 925.7e6 * 0.08, color: 'bg-emerald-500', note: '매출 −1.5%. 중동 분쟁으로 영업이익이 약 3천만 달러 줄었다.' },
      { name: '아시아·태평양', rev: 384.6e6, profit: 925.7e6 * 0.07, color: 'bg-amber-500', note: '매출 +11%, 수주 +31%.' },
    ],
    facts: [
      { label: '수주', value: '78억 달러(+39%)', note: '분기 매출(63.5억)보다 많이 주문받아 쌓이는 중. 데이터센터 냉방 수요가 크다.' },
      { label: '매출 1달러당 순이익', value: '약 15센트', note: '순이익 9.26억 ÷ 매출 63.5억 달러.' },
    ],
    how: '트레인은 세 지역의 매출과 영업이익을 공개한다. 이번 분기 지역별 영업이익을 확인하지 못해 예년 이익률(아메리카 약 21%, 아시아 약 22%, 유럽 약 15%)로 구한 비중(85:8:7)대로 순이익(9.26억 달러)을 나눴다(추정). 3분기 실적은 곧 발표 예정.',
  },
  CDNS: {
    period: '2026년 3분기(7~9월)', days: 91, src: '2026-10-26 회사 실적 발표', profitLabel: '조정 순이익(추정)',
    rows: [
      { name: '반도체 설계 소프트웨어(핵심 EDA)', rev: 1.633e9 * 0.70, profit: 0.578e9 * 0.74, color: 'bg-red-600', note: '칩 회로를 그리고 검증하는 소프트웨어. 엔비디아·애플 같은 칩 회사가 다 쓴다. 매출 +20%.' },
      { name: '설계 부품 라이선스(IP)', rev: 1.633e9 * 0.13, profit: 0.578e9 * 0.10, color: 'bg-amber-500', note: '칩에 넣는 검증된 회로 블록(메모리 연결 회로 등)을 빌려준다. 매출 +24%.' },
      { name: '시스템 설계·해석', rev: 1.633e9 * 0.17, profit: 0.578e9 * 0.16, color: 'bg-sky-500', note: '열·전자파·유체 시뮬레이션, 칩 검증용 하드웨어 등. 매출 +30%로 가장 빨리 큼.' },
    ],
    facts: [
      { label: '분기 매출', value: '16.3억 달러(+22%)', note: '받기로 계약된 미래 매출(수주 잔고) 82억 달러, 사상 최대.' },
      { label: '조정 영업이익률', value: '44.1%', note: '인수 관련 비용 등을 뺀 값. 장부상은 26.2%(인수 비용 때문에 낮음).' },
    ],
    how: '케이던스는 사업부를 하나로 공개하고, 세 제품군의 매출 비중만 따로 낸다. 이번 분기 비중을 확인하지 못해 예년 비중(70:13:17)을 썼다. 인수 관련 일회성 비용을 뺀 조정 순이익(주당 2.11달러 × 약 2.74억 주 ≈ 5.8억 달러)을 매출 비중에 이익률 차이를 조금 반영해 나눴다(추정).',
  },
  SNPS: {
    period: '2026 회계연도 3분기(2026년 5~7월)', days: 92, src: '2026년 8월 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '반도체·시스템 설계 소프트웨어', rev: 2.003e9, profit: 0.546e9 * 0.88, color: 'bg-violet-600', note: '칩 설계·검증 소프트웨어와 앤시스(인수)의 시뮬레이션 소프트웨어. 매출의 81%. 조정 영업이익률 45.2%.' },
      { name: '설계 부품 라이선스(IP)', rev: 0.474e9, profit: 0.546e9 * 0.12, color: 'bg-amber-500', note: '칩에 넣는 검증된 회로 블록. 매출 +11%로 다시 성장. 조정 영업이익률 26.5%.' },
    ],
    facts: [
      { label: '분기 매출', value: '24.8억 달러(+42%)', note: '앤시스 인수 효과가 크다.' },
      { label: '조정 주당순이익', value: '$3.91', note: '인수 관련 상각 등을 뺀 값. 장부상 $2.84(사업 매각 이익 포함).' },
    ],
    how: '시놉시스는 두 사업의 매출과 조정 영업이익률을 공개한다. 사업별 조정 영업이익(설계 소프트웨어 약 9.1억, IP 약 1.3억 달러) 비중(88:12)대로 순이익(약 5.5억 달러)을 나눴다(추정).',
  },
  CB: {
    period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-20 회사 실적 발표', profitLabel: '핵심 영업이익(추정)',
    rows: [
      { name: '북미 기업·개인 손해보험', rev: 8.7e9, profit: 2.98e9 * 0.55, color: 'bg-blue-700', note: '기업 화재·배상책임 보험(55억 달러, −2.7%), 부유층 주택·자동차 보험, 농작물 보험. 보험료 기준.' },
      { name: '해외 손해보험·재보험', rev: 4.48e9, profit: 2.98e9 * 0.32, color: 'bg-emerald-500', note: '유럽·아시아·중남미 기업·개인 보험과 보험사를 위한 보험(재보험).' },
      { name: '생명보험(주로 아시아)', rev: 1.92e9, profit: 2.98e9 * 0.13, color: 'bg-amber-500', note: '한국·대만·홍콩 등 아시아 생명보험. 보험료 +1.4%.' },
    ],
    facts: [
      { label: '보험료 100달러 중 남는 돈', value: '약 16달러', note: '손해보험 합산비율 84.1%(보험금+비용이 보험료의 84%). 여기에 보험료를 굴린 투자 수익이 더해진다.' },
      { label: '분기 순이익', value: '28.4억 달러', note: '자연재해 손실 7억 달러(1년 전 2.9억)에도 +1.5%.' },
    ],
    how: '처브는 사업별 보험료와 이익을 공개한다. 이번에 확인한 건 전체 보험료(151억), 손해보험(131.8억), 북미 기업보험(55.1억 달러)뿐이라 나머지는 예년 비중으로 나눴다. 일회성 손익을 뺀 핵심 영업이익(29.8억 달러)도 예년 비중(55:32:13)으로 나눴다(추정). 매출 칸은 받은 보험료.',
  },
  DHR: {
    period: '2026년 3분기(6~9월)', days: 91, src: '2026-10-21 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '진단 검사(베크만·세페이드)', rev: 2.68e9, profit: 1.235e9 * 0.42, color: 'bg-red-500', note: '병원 혈액 검사 장비·시약, 감염병 신속 검사. 장비를 깔아 두면 시약이 계속 팔리는 구조.' },
      { name: '바이오 의약품 생산 재료(싸이티바)', rev: 1.94e9, profit: 1.235e9 * 0.37, color: 'bg-emerald-600', note: '항체 의약품을 만들 때 쓰는 필터·배양액·장비. 이익률이 가장 높다.' },
      { name: '연구용 장비(라이카·베크만 쿨터 연구용 등)', rev: 1.94e9, profit: 1.235e9 * 0.21, color: 'bg-sky-500', note: '현미경·유전자 분석·실험실 장비.' },
    ],
    facts: [
      { label: '분기 매출', value: '65.5억 달러(+8.3%)', note: '세 사업 모두 성장.' },
      { label: '매출 1달러당 순이익', value: '약 19센트', note: '순이익 12.4억 ÷ 매출 65.5억 달러.' },
    ],
    how: '다나허는 세 사업의 매출과 영업이익을 공개하지만 이번 분기 금액을 확인하지 못했다. 1년 전 매출 비중을 이번 분기 매출(65.5억)에 맞춰 늘리고, 예년 영업이익률(바이오 약 30%, 진단 약 25%, 연구용 약 17%)로 순이익(12.4억 달러)을 나눴다(추정).',
  },
  TMO: {
    period: '2026년 3분기(7~9월)', days: 91, src: '2026-10-21 회사 실적 발표', profitLabel: '조정 순이익(추정)',
    rows: [
      { name: '실험실 소모품·제약 위탁 생산', rev: 6.86e9, profit: 2.51e9 * 0.377, color: 'bg-blue-600', note: '연구실 소모품 유통과 제약사 대신 약을 만들고 임상시험을 대행하는 사업. 매출의 절반 이상(+15%). 사업이익 10.7억 달러(이익률 15.5%).' },
      { name: '생명과학 재료(시약·바이오 생산 재료)', rev: 2.72e9, profit: 2.51e9 * 0.352, color: 'bg-emerald-500', note: '유전자 분석 시약·세포 배양 재료 등. 매출 +5%. 이익률이 가장 높은 사업(약 37%, 예년 기준).' },
      { name: '분석 장비(전자현미경·질량분석기)', rev: 2.0e9, profit: 2.51e9 * 0.176, color: 'bg-violet-500', note: '매출 +6%. 이익률 약 25%(예년 기준).' },
      { name: '진단 검사', rev: 1.1e9, profit: 2.51e9 * 0.095, color: 'bg-amber-500', note: '알레르기·감염병 진단 키트 등. 매출 약 −6%.' },
    ],
    facts: [
      { label: '분기 매출', value: '121억 달러(+9%)', note: '인수 효과 빼면 +6%. 사업 간 거래(약 5억 달러)를 빼서 위 합계보다 작다.' },
      { label: '조정 주당순이익', value: '$6.68(+15%)', note: '인수한 회사 무형자산 상각 같은 비현금 비용을 뺀 값. 장부상은 $4.64.' },
    ],
    how: '써모피셔는 네 사업의 매출과 사업이익을 공개한다. 이번에 확인한 건 실험실·위탁 생산 사업이익(10.7억)뿐이고, 나머지 세 사업은 예년 이익률로 잡았다. 진단 매출은 줄었다는 보도만 있어 약 11억 달러로 추정. 조정 순이익(주당 6.68달러 × 약 3.76억 주 ≈ 25.1억 달러)을 사업이익 비중대로 나눴다(추정).',
  },
  INTU: {
    period: '2026 회계연도(2025년 8월~2026년 7월, 1년)', days: 365, src: '2026-08-25 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '중소기업 회계·결제(퀵북스·메일침프)', rev: 12.9e9, profit: 4.566e9 * 0.55, color: 'bg-emerald-600', units: { n: 9.9e9 / 90, unit: '달 치', what: '퀵북스 온라인 한 달 구독(약 $90)', value: true }, note: '회사 매출의 60%(+16%). 이 중 온라인 서비스 99억 달러(+19%)가 핵심.' },
      { name: '개인 세금 신고·신용 관리(터보택스·크레딧카르마)', rev: 8.6e9, profit: 4.566e9 * 0.45, color: 'bg-blue-600', units: { n: 5.3e9 / 130, unit: '건', what: '터보택스 세금 신고 1건(평균 약 $130)', value: true }, note: '+11%. 터보택스 53억 달러(+7%). 세금 신고철(1~4월)에 매출이 몰린다.' },
    ],
    facts: [
      { label: '1년 매출', value: '214억 달러(+14%)', note: '순이익 45.7억 달러.' },
      { label: '계절성', value: '2~4월에 몰림', note: '미국 세금 신고 마감(4월) 때문에 1년 이익의 대부분이 2~4월 분기에 난다. 그래서 분기가 아니라 1년 숫자로 계산했다.' },
    ],
    how: '인튜이트는 사업별 매출과 영업이익을 공개하지만 영업이익을 이번에 확인하지 못했다. 1년 순이익(45.7억 달러)을 매출 × 예년 이익률(기업용 약 45%, 개인용 약 55%) 비중으로 55:45로 나눴다(추정). "건·달 치"는 매출을 대표 가격으로 나눈 환산값.',
  },
  LRCX: {
    period: '2027 회계연도 1분기(2026년 7~9월)', days: 91, src: '2026-10-21 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '반도체 장비 판매', rev: 5.73e9, profit: 2.75e9 * 5.73 / 8.22, color: 'bg-blue-600', note: '반도체 회로를 깎고(식각) 쌓는(증착) 장비. 매출의 70%. 메모리 46%·위탁생산(파운드리) 46%·기타 8%.' },
      { name: '장비 정비·부품·업그레이드', rev: 2.49e9, profit: 2.75e9 * 2.49 / 8.22, color: 'bg-emerald-500', note: '이미 팔린 장비(전 세계 약 10만 대)의 부품·정비·성능 개선. 1년 전보다 +40%. 경기가 나빠도 덜 흔들리는 매출.' },
    ],
    facts: [
      { label: '분기 매출', value: '82.2억 달러(+54%)', note: '사상 최대. 직전 분기보다 +22%.' },
      { label: '매출 1달러당 순이익', value: '약 33센트', note: '순이익 27.5억 ÷ 매출 82.2억 달러. 영업이익률 40%(사상 최고).' },
    ],
    how: '램리서치는 사업부를 하나로 공개한다. 장비 판매와 정비·부품 매출은 따로 공개하지만 이익은 나누지 않아, 순이익(27.5억 달러)을 매출 비중대로 나눴다(추정). 실제로는 정비·부품 이익률이 더 높을 가능성이 크다.',
  },
  UNP: {
    period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-22 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '공산품(금속·광물·화학·목재)', rev: 2.509e9, profit: 2.076e9 * 2.509 / 7.2, color: 'bg-orange-500', units: { n: 606e3, unit: '량', what: '화물칸 운송(실제)' }, note: '매출 +14%. 금속·광물 물량 +8%.' },
      { name: '컨테이너·자동차(프리미엄)', rev: 2.245e9, profit: 2.076e9 * 2.245 / 7.2, color: 'bg-blue-600', units: { n: 1158e3, unit: '량', what: '화물칸·컨테이너 운송(실제)' }, note: '항구에서 내륙으로 가는 컨테이너와 완성차. 매출 +21%, 물량 +9%.' },
      { name: '곡물·석탄·비료(벌크)', rev: 2.06e9, profit: 2.076e9 * 2.06 / 7.2, color: 'bg-amber-500', units: { n: 529e3, unit: '량', what: '화물칸 운송(실제)' }, note: '매출 +10%, 물량 제자리(곡물 +5%, 석탄 −3%).' },
      { name: '기타(부대 수입)', rev: 0.39e9, profit: 2.076e9 * 0.39 / 7.2, color: 'bg-gray-400', note: '화물칸 보관료·부동산 임대 등.' },
    ],
    facts: [
      { label: '화물칸 1량당 매출', value: '약 $2,970', note: '운임 68.1억 ÷ 229.3만 량.' },
      { label: '화물칸 1량당 순이익', value: '약 $905', note: '순이익 20.8억 ÷ 229.3만 량. 매출 100달러 중 41달러가 비용을 빼고 남는다(영업비용 비율 59.1%).' },
    ],
    how: '유니언퍼시픽은 사업부를 하나로 공개하고, 세 화물 그룹의 운임과 물량만 따로 낸다. 공산품 운임(25.1억)은 확인했고, 컨테이너·벌크 운임은 1년 전 대비 증가율(+21%, +10%)과 합계로 거꾸로 계산했다. 순이익(20.8억 달러)을 매출 비중대로 나눴다(추정). "량"은 실제 운송한 화물칸 수.',
  },
  SYK: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026-07-30 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '수술·신경 장비(메드서지)', rev: 3.6e9, profit: 1.27e9 * 0.50, color: 'bg-blue-600', note: '수술 도구·병원 침대·뇌혈관 시술 기구·내시경 카메라. 매출 +9.7%, 사업 이익률 28.1%.' },
      { name: '인공관절·척추(정형외과)', rev: 3.0e9, profit: 1.27e9 * 0.50, color: 'bg-red-500', note: '무릎·고관절 인공관절, 수술 로봇 마코. 매출 +9.1%, 사업 이익률 34.0%로 더 높다.' },
    ],
    facts: [
      { label: '분기 매출', value: '66억 달러(+9.4%)', note: '3분기 실적은 10월 29일 발표 예정.' },
      { label: '매출 1달러당 순이익', value: '약 19센트', note: '순이익 약 12.7억(주당 3.30달러 × 약 3.85억 주) ÷ 매출 66억 달러.' },
    ],
    how: '스트라이커는 두 사업의 매출과 사업 이익률을 공개한다. 사업이익(메드서지 약 10.1억, 정형외과 약 10.2억 달러)이 거의 같아, 순이익(약 12.7억 달러)을 50:50으로 나눴다(추정).',
  },
  PG: {
    period: '2027 회계연도 1분기(2026년 7~9월)', days: 92, src: '2026-10-22 회사 실적 발표', profitLabel: '순이익',
    rows: [
      { name: '세탁·주방 세제(타이드·다우니·페브리즈)', rev: 8.205e9, profit: 1.601e9, color: 'bg-orange-500', units: { n: 8.205e9 / 13, unit: '통', what: '타이드 세제 한 통(약 $13)', value: true }, note: '회사 매출의 35%로 가장 큰 사업. 매출 +4%, 판매량이 늘어난 덕분.' },
      { name: '기저귀·생리대·휴지(팸퍼스·바운티)', rev: 5.322e9, profit: 1.06e9, color: 'bg-sky-500', units: { n: 5.322e9 / 27, unit: '팩', what: '팸퍼스 기저귀 한 팩(약 $27)', value: true }, note: '매출 +3%, 순이익 −4%(원가 상승).' },
      { name: '뷰티(팬틴·헤드앤숄더·올레이·SK-II)', rev: 4.41e9, profit: 0.95e9, color: 'bg-pink-500', note: '매출 +6%로 다섯 사업 중 가장 빨리 큼. 순이익은 확인하지 못해 예년 이익률(약 21%)로 추정.' },
      { name: '건강용품(오랄비·크레스트·빅스)', rev: 3.318e9, profit: 0.783e9, color: 'bg-emerald-500', units: { n: 3.318e9 / 4, unit: '개', what: '크레스트 치약 한 개(약 $4)', value: true }, note: '칫솔·치약·감기약. 매출 +3%, 순이익 +9%.' },
      { name: '면도기(질레트·비너스)', rev: 1.889e9, profit: 0.477e9, color: 'bg-blue-600', units: { n: 1.889e9 / 4, unit: '개', what: '질레트 면도날 한 개(약 $4)', value: true }, note: '매출 +4%. 매출 1달러당 순이익 25센트로 가장 남는 사업.' },
      { name: '본사 비용 등', rev: 0.156e9, profit: 4.8e9 - 1.601e9 - 1.06e9 - 0.95e9 - 0.783e9 - 0.477e9, color: 'bg-gray-400', note: '사업부에 나누지 않은 본사 비용·이자 등(전체 순이익에서 위 다섯 사업을 뺀 값).' },
    ],
    facts: [
      { label: '분기 매출', value: '233억 달러(+4%)', note: '가격보다 판매량(+2%)이 늘어난 것이 컸다.' },
      { label: '매출 1달러당 순이익', value: '약 21센트', note: '순이익 48억 ÷ 매출 233억 달러.' },
    ],
    how: 'P&G는 다섯 사업의 매출과 순이익을 직접 공개한다. 뷰티 순이익만 이번에 확인하지 못해 추정했고, 남는 차이는 "본사 비용 등"에 넣었다. "개·통·팩"은 사업 매출을 대표 상품 소매가로 나눈 환산값이라 실제 판매 개수와 다르다(소매점 마진 때문에 실제로는 더 많이 팔린다).',
  },
  PEP: {
    period: '2026년 3분기(6~9월, 12주)', days: 84, src: '2026-10-08 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '북미 과자(레이즈·도리토스·퀘이커)', rev: 6.504e9, profit: 3.048e9 * 1.38 / 4.68, color: 'bg-amber-500', units: { n: 6.504e9 / 5, unit: '봉지', what: '레이즈 감자칩 큰 봉지(약 $5)', value: true }, note: '매출 제자리(−0.3%). 예전 가장 큰 돈줄이지만 판매량이 줄고 있다.' },
      { name: '북미 음료(펩시·게토레이·마운틴듀)', rev: 7.706e9, profit: 3.048e9 * 1.01 / 4.68, color: 'bg-blue-600', units: { n: 7.706e9 / 9, unit: '묶음', what: '펩시 캔 12개 묶음(약 $9)', value: true }, note: '매출 +5%(대부분 인수한 회사 덕분). 이익률은 과자보다 낮다.' },
      { name: '해외(유럽·중남미·아시아 등)', rev: 11.064e9, profit: 3.048e9 * 2.29 / 4.68, color: 'bg-emerald-500', note: '유럽·중동·아프리카 54억, 중남미 과자 30억, 아시아 과자 12억, 해외 음료 원액 판매 14억 달러. 모두 두 자릿수 가까이 성장.' },
    ],
    facts: [
      { label: '분기 매출', value: '253억 달러(+5.6%)', note: '환율·인수 효과 빼면 +3.1%.' },
      { label: '매출 1달러당 순이익', value: '약 12센트', note: '순이익 30.5억 ÷ 매출 253억 달러.' },
    ],
    how: '펩시코는 사업별 매출과 영업이익을 공개한다. 북미 과자(약 13.8억)·음료(약 10.1억 달러)의 일회성 항목을 뺀 영업이익은 확인했고, 해외 몫(약 22.9억)은 전체 영업이익에서 북미 두 곳과 본사 비용(약 4억, 예년 수준 추정)을 빼서 구했다. 순이익(30.5억 달러)을 이 비율대로 나눴다(추정). "봉지·묶음"은 매출을 소매가로 나눈 환산값.',
  },
  JNJ: {
    period: '2026년 3분기(7~9월)', days: 91, src: '2026-10-13 회사 실적 발표', profitLabel: '조정 순이익(추정)',
    rows: [
      { name: '전문 의약품', rev: 16.8e9, profit: 6.27e9 * 0.78, color: 'bg-red-600', note: '암·면역·정신질환 처방약. 매출 +7.9%(환율 빼고). 특허가 끝난 스텔라라 매출 급감을 새 약들이 메우는 중.' },
      { name: '의료기기(메드텍)', rev: 8.64e9, profit: 6.27e9 * 0.22, color: 'bg-sky-600', note: '심장 시술 기구·인공관절·수술 도구·콘택트렌즈. 매출 +2.5%로 기대보다 부진.' },
    ],
    products: {
      title: '대표 약',
      note: '분기 매출. 이익은 회사가 약별로 공개하지 않아 전문 의약품 사업의 순이익률(약 29%)을 똑같이 적용한 추정값.',
      rows: [
        { name: '다잘렉스(다발골수종 치료제)', rev: 4.24e9, profit: 4.24e9 * 0.29, color: 'bg-red-500', note: '회사에서 가장 많이 팔리는 약(+15%).' },
        { name: '트렘피어(건선·장염 치료제)', rev: 2.4e9, profit: 2.4e9 * 0.29, color: 'bg-orange-500', note: '+68%로 가장 빨리 크는 약.' },
        { name: '스텔라라(건선·장염, 특허 만료)', rev: 0.716e9, profit: 0.716e9 * 0.29, color: 'bg-gray-400', note: '복제약이 나와 −54%. 트렘피어가 자리를 넘겨받는 중.' },
      ],
    },
    facts: [
      { label: '분기 매출', value: '254억 달러(+5.9%)', note: '2026년 연 매출 1,010억 달러 넘게 예상.' },
      { label: '장부상 순이익', value: '약 2억 달러', note: '활석(베이비파우더) 소송 합의금 등 일회성 비용 약 70억 달러 때문. 위 표는 이를 뺀 조정 순이익(주당 2.59달러 × 약 24.2억 주 ≈ 62.7억 달러) 기준.' },
    ],
    how: 'J&J는 두 사업의 매출을 공개한다. 소송 합의금 같은 일회성 비용을 뺀 조정 순이익(약 62.7억 달러)을 예년 사업별 세전이익 비중(의약품이 약 4분의 3 이상)에 맞춰 78:22로 나눴다(추정).',
  },
  WMT: {
    period: '2027 회계연도 2분기(2026년 5~7월)', days: 92, src: '2026-08-20 회사 실적 발표', profitLabel: '조정 순이익(추정)',
    rows: [
      { name: '월마트 미국', rev: 125.2e9, profit: 6.46e9 * 0.80, color: 'bg-blue-600', note: '미국 매장 약 4,600개·온라인. 매출 +3.5%, 영업이익 81억 달러(+21%, 관세 환급 포함).' },
      { name: '해외(멕시코·캐나다·중국·인도 플립카트 등)', rev: 35.2e9, profit: 6.46e9 * 0.13, color: 'bg-emerald-500', note: '매출 +12.8%(환율 빼고 +7.9%).' },
      { name: '샘스클럽(회원제 창고형 매장)', rev: 25.7e9, profit: 6.46e9 * 0.07, color: 'bg-sky-400', note: '매출 +8.8%(기름 빼고 +4.5%).' },
    ],
    facts: [
      { label: '분기 매출', value: '1,879억 달러(+5.9%)', note: '광고·회원비 포함. 하루 약 20억 달러.' },
      { label: '매출 1달러당 순이익', value: '약 3.4센트', note: '조정 순이익 약 65억 ÷ 매출 1,879억 달러. 거의 원가에 가깝게 판다.' },
    ],
    how: '월마트는 세 사업의 매출과 영업이익을 공개한다. 미국 영업이익(81억)은 확인했지만 해외·샘스클럽은 이번 분기 금액을 찾지 못해 예년 비중으로 잡았다. 조정 순이익(주당 0.81달러 × 약 79.8억 주 ≈ 64.6억 달러)을 80:13:7로 나눴다(추정).',
  },
  TJX: {
    period: '2027 회계연도 2분기(2026년 5~7월)', days: 91, src: '2026-08-19 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: 'TJ맥스·마셜스(미국 옷·잡화)', rev: 9.1e9, profit: 1.36e9 * 0.68, color: 'bg-red-600', note: '회사 매출의 60%. 매출 +3%, 매장 매출 +1%로 다소 부진. 사업이익률 15.6%.' },
      { name: '홈굿즈(미국 생활용품)', rev: 2.507e9, profit: 1.36e9 * 0.21, color: 'bg-amber-500', note: '매출 +10%. 사업이익률 17.6%(관세 환급 포함).' },
      { name: '캐나다', rev: 1.47e9, profit: 1.36e9 * 0.06, color: 'bg-sky-500', note: '위너스·마셜스 캐나다. 매출 +6%.' },
      { name: '유럽·호주', rev: 2.103e9, profit: 1.36e9 * 0.05, color: 'bg-emerald-500', note: 'TK맥스 등. 매장 매출 +7%.' },
    ],
    facts: [
      { label: '분기 매출', value: '152억 달러(+5%)', note: '같은 매장 매출 +4%.' },
      { label: '매출 1달러당 순이익', value: '약 9센트', note: '조정 세전이익률 11.9% × (1 − 세율 약 25%).' },
    ],
    how: 'TJX는 네 사업의 매출과 사업이익을 공개한다. 미국 두 사업의 사업이익률은 확인했고, 캐나다·유럽은 예년 이익률로 잡았다. 순이익은 매출 × 조정 세전이익률(11.9%) × (1 − 세율 25%) ≈ 13.6억 달러로 추정해 사업이익 비중(68:21:6:5)대로 나눴다. 유럽·호주 매출은 전체에서 나머지 세 사업을 뺀 값.',
  },
  GE: {
    period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-20 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '민항기 엔진·정비', rev: 10.3e9, profit: 2.9e9 * 0.714, color: 'bg-sky-600', units: { n: 43200 * 92, unit: '번', what: 'GE 엔진 비행기 이륙(회사 발표 2초에 1번)' }, note: '여객기 엔진(CFM 합작 포함)과 정비·부품(+21%). 엔진을 팔고 수십 년 동안 정비로 버는 구조라 정비 매출이 대부분.' },
      { name: '군용 엔진·부품', rev: 3.5e9, profit: 0.475e9 * 0.714, color: 'bg-gray-600', note: '전투기·헬기 엔진, 항공 부품(+7%).' },
    ],
    facts: [
      { label: '민항기 이익 비중', value: '약 86%', note: '민항기 엔진·정비가 이익 대부분. 6분기 연속 20% 넘게 성장.' },
      { label: '이륙 1번당 회사 순이익', value: '약 $600', note: '분기 순이익 약 24억 ÷ 이륙 약 400만 번(2초에 1번 × 92일).' },
    ],
    how: 'GE 에어로스페이스는 두 부문의 이익을 공개한다. 각 부문 이익에 계속사업 순이익 ÷ 두 부문 이익 합계(24.1억 ÷ 33.8억 = 0.714)를 곱했다(본사 비용 등을 비율대로 나눠 뺀 추정).',
  },
  JPM: {
    period: '2026년 3분기(7~9월)', days: 92, src: '2026년 10월 회사 실적 발표', profitLabel: '순이익',
    rows: [
      { name: '개인·소상공인 은행(체이스)', rev: 21.2e9, profit: 5.7e9, color: 'bg-blue-600', note: '예금·신용카드·주택담보대출·자동차 대출(순이익 +13%).' },
      { name: '기업·투자은행', rev: 22.7e9, profit: 8.2e9, color: 'bg-gray-700', note: '기업 대출·M&A 자문·주식·채권 트레이딩(순이익 +20%, 트레이딩 매출 103억 +15%).' },
      { name: '자산·부자 관리', rev: 0, profit: 1.84e9, color: 'bg-amber-500', note: '펀드 운용·고액 자산가 관리(순이익 +11%, 매출은 확인하지 못함).' },
      { name: '본사(투자 손실 등)', rev: 0, profit: -0.43e9, color: 'bg-gray-300', note: '보유 채권 매각 손실 6.6억 달러 등.' },
    ],
    facts: [
      { label: '분기 순이익', value: '153억 달러', note: '1년 전보다 +6%. 세계에서 가장 많이 버는 은행.' },
      { label: '기업·투자은행 비중', value: '약 52%', note: '흑자 부문 이익 중 기업·투자은행 몫.' },
    ],
    how: 'JP모건은 부문별 순이익을 공개한다(회사 발표 그대로). 자산·부자 관리 매출은 이번 분기 숫자를 확인하지 못해 비워 뒀다.',
  },
  BKNG: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026년 8월 회사 분기 보고서', profitLabel: '순이익(추정)',
    rows: [
      { name: '직접 결제(머천트)', rev: 5.127e9, profit: 1.95e9 * 5.127 / 7.352, color: 'bg-blue-600', units: { n: 325e6, unit: '박', what: '예약된 숙박(전체, 실제)' }, note: '손님이 부킹닷컴에 바로 돈을 내는 예약(+15%). 결제 수수료까지 챙길 수 있어 회사가 이쪽으로 옮기는 중.' },
      { name: '중개 수수료(에이전시)', rev: 1.903e9, profit: 1.95e9 * 1.903 / 7.352, color: 'bg-sky-400', note: '손님은 호텔에 내고 부킹닷컴은 수수료만 받는 예약(−6.9%, 머천트로 옮겨 가는 중).' },
      { name: '광고 등', rev: 0.322e9, profit: 1.95e9 * 0.322 / 7.352, color: 'bg-amber-500', note: '카약(KAYAK) 광고·오픈테이블 등(+8.1%).' },
    ],
    facts: [
      { label: '숙박 1박당 회사 순이익', value: '약 $6', note: '순이익 19.5억 ÷ 숙박 3.25억 박.' },
      { label: '예약 금액 중 회사 몫', value: '약 14.4%', note: '총 예약 510억 달러 중 매출 73.5억.' },
    ],
    how: '부킹홀딩스는 매출 종류만 나눠 공개한다. 순이익(19.5억 달러)을 매출 비중대로 나눴다(추정).',
  },
  ADP: {
    period: '2026 회계연도 4분기(2026년 4~6월)', days: 91, src: '2026년 7월 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '급여·인사 소프트웨어', rev: 3.7e9, profit: 1.0e9 * 0.85, color: 'bg-red-600', note: '회사들의 월급 계산·세금 신고·인사 관리 대행(+7%). 맡아 둔 급여 자금의 이자도 여기서 번다.' },
      { name: '인사 아웃소싱(PEO)', rev: 1.8e9, profit: 1.0e9 * 0.15, color: 'bg-gray-500', note: '작은 회사의 직원을 대신 고용해 보험·복지까지 처리(+7%). 보험료 등 그대로 넘기는 돈이 많아 이익률이 낮다.' },
    ],
    facts: [
      { label: '미국 직장인 중 ADP로 월급 받는 비중', value: '약 6명 중 1명', note: '회사 설명 기준(대략).' },
      { label: '매출 1달러당 순이익', value: '약 18센트', note: '순이익 10억 ÷ 매출 55억 달러.' },
    ],
    how: 'ADP는 두 부문 이익을 공개하지만 이번 분기 금액을 확인하지 못했다. 아웃소싱 매출은 전체 − 급여 소프트웨어로 구했고, 순이익(10억 달러)은 두 부문의 평소 이익률 차이를 반영해 85:15로 나눴다(추정).',
  },
  CTAS: {
    period: '2027 회계연도 1분기(2026년 6~8월)', days: 92, src: '2026-09-23 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '유니폼 대여·시설 관리', rev: 3.01e9 * 0.77, profit: 551.7e6 * 0.76, color: 'bg-blue-700', note: '작업복을 빌려주고 매주 세탁·교체, 매트·화장실 용품 관리(+8%, 매출총이익률 50.8%).' },
      { name: '구급함·안전용품', rev: 3.01e9 * 0.115, profit: 551.7e6 * 0.13, color: 'bg-red-500', note: '회사 구급함 채워 주기·안전 교육(+14.2%, 매출총이익률 57.6%로 가장 높다).' },
      { name: '소방 설비·유니폼 판매', rev: 3.01e9 * 0.115, profit: 551.7e6 * 0.11, color: 'bg-gray-500', note: '소화기 점검·소방 설비(+9.2%), 유니폼 직접 판매(+9.6%).' },
    ],
    facts: [
      { label: '매출 1달러당 순이익', value: '약 18센트', note: '순이익 5.52억 ÷ 매출 30.1억 달러.' },
      { label: '성장 원천', value: '가격보다 물량', note: '회사 설명: 가격 인상이 아니라 새 고객·물량 증가로 큰다.' },
    ],
    how: '신타스는 부문별 매출을 공개하지만 이번 분기 금액을 확인하지 못해, 최근 연간 비중(유니폼 약 77%·구급함 약 11.5%·기타 약 11.5%)으로 나누고 순이익은 부문별 매출총이익률을 반영해 나눴다(추정).',
  },
  ADBE: {
    period: '2026 회계연도 3분기(2026년 6~8월)', days: 91, src: '2026년 9월 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '크리에이티브·PDF(디지털 미디어)', rev: 6.76e9 * 0.752, profit: 1.83e9 * 0.8, color: 'bg-red-600', units: { n: 6.76e9 * 0.752 / 60, unit: '달 치', what: '크리에이티브 클라우드 한 달 구독(약 $60)', value: true }, note: '포토샵·일러스트레이터·프리미어·아크로뱃 PDF 구독. 회사 매출의 약 4분의 3.' },
      { name: '기업 마케팅 소프트웨어(디지털 경험)', rev: 6.76e9 * 0.248, profit: 1.83e9 * 0.2, color: 'bg-gray-600', note: '기업용 웹사이트·고객 데이터·마케팅 자동화 소프트웨어.' },
    ],
    facts: [
      { label: '매출 성장', value: '+13%', note: '분기 매출 67.6억 달러, 사상 최대.' },
      { label: '매출 1달러당 순이익', value: '약 27센트', note: '순이익 18.3억 ÷ 매출 67.6억 달러.' },
    ],
    how: '어도비는 두 부문 매출을 공개하지만 이번 분기 금액을 확인하지 못해, 최근 1년 비중(약 75:25)으로 나눴다. 순이익(18.3억 달러)은 디지털 미디어 이익률이 더 높은 점을 반영해 80:20으로 나눴다(추정).',
  },
  V: {
    period: '2026 회계연도 3분기(2026년 4~6월)', days: 91, src: '2026-07-28 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '결제 처리 수수료', rev: 6.04e9, profit: 5.6e9 * 6.04 / 16.31, color: 'bg-blue-700', units: { n: 71.7e9, unit: '건', what: '비자 망 결제 처리(실제)' }, note: '결제 1건이 비자 망을 지나갈 때마다 받는 처리 수수료(+17%). 결제 717억 건.' },
      { name: '카드 사용액 수수료', rev: 4.92e9, profit: 5.6e9 * 4.92 / 16.31, color: 'bg-sky-500', note: '카드로 쓴 금액에 비례해 은행에서 받는 수수료(+14%).' },
      { name: '해외 결제 수수료', rev: 3.85e9, profit: 5.6e9 * 3.85 / 16.31, color: 'bg-amber-500', note: '해외여행·해외 직구처럼 나라를 넘는 결제에 붙는 수수료(+6%). 수수료율이 높아 가장 남는 장사.' },
      { name: '부가 서비스 등', rev: 1.50e9, profit: 5.6e9 * 1.50 / 16.31, color: 'bg-emerald-500', note: '사기 방지·데이터·컨설팅 등(+45%).' },
    ],
    facts: [
      { label: '결제 1건당 순매출', value: '약 16센트', note: '순매출 116억 ÷ 결제 717억 건. 위 수수료 합계(163억)에서 은행에 돌려주는 장려금(47억 달러)을 뺀 값.' },
      { label: '결제 1건당 순이익', value: '약 7.8센트', note: '순이익 56억 ÷ 결제 717억 건.' },
    ],
    how: '비자는 사업별 이익을 공개하지 않는다. 순이익(56억 달러)을 네 가지 수수료의 매출(은행 장려금 빼기 전 총액 163억 달러) 비중대로 나눴다(추정). 위 표의 매출 합계는 장려금을 빼기 전 금액이라 순매출(116억)보다 크다.',
  },
  COST: {
    period: '2026 회계연도 4분기(2026년 5~8월, 16주)', days: 112, src: '2026년 9월 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '물건 판매', rev: 93.87e9, profit: 2.998e9 - 1.85e9 * 0.75, color: 'bg-red-500', units: { n: 93.87e9 / 1.5, unit: '개', what: '핫도그 세트($1.50, 1985년부터 같은 값)', value: true }, note: '식료품·가전·기름 등(+11%). 매출은 크지만 거의 원가에 판다(남는 돈이 매출의 약 1.7%).' },
      { name: '연회비', rev: 1.85e9, profit: 1.85e9 * 0.75, color: 'bg-blue-600', note: '연회비 내는 회원 8,410만 명의 회비(+7.3%). 비용이 거의 들지 않아 대부분이 이익.' },
    ],
    facts: [
      { label: '이익 중 연회비 몫', value: '약 46%', note: '매출의 2%인 연회비가 순이익의 절반 가까이를 만든다(세금 25% 가정 추정). 물건은 싸게 팔고 회비로 번다.' },
      { label: '회원 1명당 1년 순이익', value: '약 $110', note: '연간 순이익 92.3억 ÷ 회원 8,410만 명.' },
    ],
    how: '코스트코는 연회비 이익을 따로 공개하지 않는다. 연회비는 비용이 거의 없다고 보고 세금 25%만 뺀 금액을 연회비 이익으로, 나머지 순이익을 물건 판매 이익으로 봤다(추정).',
  },
  LLY: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026-08-05 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '마운자로(당뇨·비만)', rev: 9.94e9, profit: 7.10e9 * 9.94 / 22.97, color: 'bg-violet-500', units: { n: 9.94e9 / 1000, unit: '달 치', what: '한 달 치 약값(약 $1,000, 미국 정가 대략)', value: true }, note: '주 1회 맞는 당뇨·비만 주사(+91%). 회사 매출 1위.' },
      { name: '젭바운드(비만, 미국)', rev: 4.93e9, profit: 7.10e9 * 4.93 / 22.97, color: 'bg-pink-500', units: { n: 4.93e9 / 1000, unit: '달 치', what: '한 달 치 약값(약 $1,000, 미국 정가 대략)', value: true }, note: '마운자로와 같은 성분의 비만 전용 이름(+46%).' },
      { name: '기타 약(항암·면역 등)', rev: 8.10e9, profit: 7.10e9 * 8.10 / 22.97, color: 'bg-gray-400', note: '버제니오(유방암)·자디앙(당뇨)·탈츠(건선) 등 나머지.' },
    ],
    facts: [
      { label: '비만·당뇨 주사 비중', value: '65%', note: '마운자로 + 젭바운드가 매출의 약 3분의 2.' },
      { label: '가격 vs 판매량', value: '값 −13%, 양 +60%', note: '약값은 내렸지만 훨씬 많이 팔려 매출이 48% 늘었다.' },
    ],
    how: '일라이릴리는 약별 매출만 공개한다. 순이익(71억 달러)을 매출 비중대로 나눴다(추정). 한 달 치 약값은 할인·보험이 많아 실제 받는 값과 다르다.',
  },
  MCO: {
    period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-21 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '신용평가(MIS)', rev: 1.09e9, profit: 734e6 * 1.09 / 2.026, color: 'bg-blue-700', note: '회사·나라가 빚(채권)을 낼 때 받는 신용등급 평가 수수료(−1%). 실제 이익률은 아래 데이터 사업보다 높다.' },
      { name: '데이터·분석(MA)', rev: 0.936e9, profit: 734e6 * 0.936 / 2.026, color: 'bg-teal-500', note: '은행·보험사에 파는 위험 분석 소프트웨어·데이터 구독(+3%, 연간 구독 매출 36.9억 달러 +8%).' },
    ],
    facts: [
      { label: '매출 1달러당 순이익', value: '약 36센트', note: '순이익 7.34억 ÷ 매출 20.3억 달러.' },
      { label: 'S&P와 둘이 나눠 먹는 시장', value: '신용평가 약 80%', note: '무디스·S&P 두 회사가 세계 신용평가 시장의 대부분을 차지한다(업계 통설).' },
    ],
    how: '무디스는 두 부문 이익을 공개하지만 이번 분기 숫자를 확인하지 못해, 순이익(7.34억 달러)을 매출 비중대로 나눴다(추정). 실제로는 신용평가 몫이 더 크다.',
  },
  SHW: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026년 7월 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '페인트 매장', rev: 3890e6, profit: 957.6e6 * 0.755, color: 'bg-blue-600', units: { n: 3890e6 / 80, unit: '통', what: '페인트 1갤런(약 $80)', value: true }, note: '미국·캐나다 직영 페인트 매장 약 4,800곳. 손님 대부분이 페인트 시공업자(+5.1%).' },
      { name: '소비자 브랜드', rev: 983.5e6, profit: 212.9e6 * 0.755, color: 'bg-amber-500', note: '마트·홈센터에서 파는 페인트 브랜드(+21.5%).' },
      { name: '산업용 도료', rev: 1913.8e6, profit: 273.3e6 * 0.755, color: 'bg-gray-500', note: '자동차 보수·공장 설비·포장재용 도료(+6.3%).' },
      { name: '본사 비용 등', rev: 0, profit: -331.3e6 * 0.755, color: 'bg-gray-300', note: '이자·본사 관리비 등 부문에 나누지 않은 비용.' },
    ],
    facts: [
      { label: '페인트 매장 이익 비중', value: '약 67%', note: '직영 매장이 이익의 3분의 2를 만든다.' },
      { label: '매출 1달러당 순이익', value: '약 12센트', note: '순이익 약 8.4억(희석 EPS 3.43달러 × 약 2.45억 주) ÷ 매출 67.9억 달러.' },
    ],
    how: '셔윈윌리엄스는 세 부문의 이익(세전)을 공개한다. 각 부문 이익에 회사 순이익 ÷ 세전이익(약 8.4억 ÷ 11.1억 = 0.755)을 곱했다(추정). 페인트 1갤런 가격은 대략치.',
  },
  SPGI: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026년 7월 회사 실적 발표', profitLabel: '세후 조정 영업이익(추정)',
    rows: [
      { name: '신용평가', rev: 1.34e9, profit: 0.917e9 * 0.78, color: 'bg-red-600', note: '채권 신용등급 평가(+17%, 조정 영업이익 9.17억 달러, 이익률 68%).' },
      { name: '데이터·분석(MI)', rev: 1.24e9, profit: 1.24e9 * 0.33 * 0.78, color: 'bg-blue-500', note: '기업 재무 데이터·분석 플랫폼(+6%). 이익은 이익률 약 33%로 가정한 추정.' },
      { name: '주가지수(S&P 500 등)', rev: 0.534e9, profit: 0.382e9 * 0.78, color: 'bg-amber-500', note: 'S&P 500 같은 지수 사용료. 지수를 따라가는 펀드가 커질수록 저절로 늘어난다(+20%, 이익률 72%).' },
      { name: '에너지 정보', rev: 0.623e9, profit: 0.296e9 * 0.78, color: 'bg-gray-600', note: '원유·가스 가격 정보(플랫츠, +3%).' },
    ],
    facts: [
      { label: '지수 사업 이익률', value: '72%', note: '한 번 만든 지수에 사용료만 받으면 돼서 가장 많이 남긴다.' },
      { label: '신용평가 이익 비중', value: '약 50%', note: '신용평가가 이익의 절반을 만든다.' },
    ],
    how: 'S&P 글로벌은 부문별 조정 영업이익을 공개한다(데이터·분석 부문은 이번 분기 숫자를 확인하지 못해 이익률 33%로 가정). 각 부문 이익에서 세금 약 22%를 뺐다(추정). 3분기 실적은 10월 27일 발표.',
  },
  KO: {
    period: '2026년 3분기(7~9월)', days: 91, src: '2026-10-27 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '북미', rev: 5401e6 * 1.063, profit: 4009e6 * 0.363, color: 'bg-red-600', note: '영업이익률 약 31%. 미국에서는 코카콜라가 병입까지 일부 직접 해서 이익률이 낮다. 3분기 영업이익 +5%.' },
      { name: '유럽·중동·아프리카', rev: 3085e6 * 1.063, profit: 4009e6 * 0.280, color: 'bg-indigo-500', note: '영업이익률 약 42%. 3분기 영업이익 +7%.' },
      { name: '중남미', rev: 1839e6 * 1.063, profit: 4009e6 * 0.252, color: 'bg-amber-500', note: '영업이익률 약 64%로 가장 높다(원액만 팔고 병입은 현지 회사가 한다). 3분기 영업이익 +29%(환율 효과 포함).' },
      { name: '아시아·태평양', rev: 1483e6 * 1.063, profit: 4009e6 * 0.140, color: 'bg-green-500', note: '영업이익률 약 44%.' },
      { name: '병입 투자', rev: 1531e6 * 1.063, profit: 4009e6 * 0.020, color: 'bg-gray-500', note: '코카콜라가 직접 가진 병입 공장(인도·아프리카 등). 매출은 크지만 이익률 6%.' },
      { name: '본사 비용', rev: 0, profit: -4009e6 * 0.055, color: 'bg-gray-300', note: '본사 관리비·광고 일부.' },
    ],
    facts: [
      { label: '하루 마시는 잔 수', value: '약 22억 잔', note: '회사 추정(전 세계 모든 코카콜라 음료). 3분기 판매량 +5%.' },
      { label: '한 잔당 회사 순이익', value: '약 2센트', note: '분기 순이익 40.1억 ÷ (22억 잔 × 91일).' },
    ],
    how: '3분기 회사 전체 매출(133.8억)·순이익(40.1억 달러)은 실제 숫자다. 지역별 이익 비중은 3분기 금액을 확인하지 못해 2분기 비중(지역별 영업이익 ÷ 이익률로 매출을 거꾸로 계산)을 그대로 썼고, 지역 간 거래가 섞여 매출 합계가 실제보다 조금 크다(추정).',
  },
  ORLY: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026년 7월 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '정비소 납품(전문가)', rev: 4.892e9 * 0.47, profit: 700e6 * 0.47, color: 'bg-green-600', note: '정비소에 부품을 배달해 주는 사업(기존 매장 매출 약 +10%, 4분기 연속 두 자릿수). 매출의 약 절반(회사 설명 기준 대략).' },
      { name: '일반 고객(DIY)', rev: 4.892e9 * 0.53, profit: 700e6 * 0.53, color: 'bg-emerald-400', units: { n: 4.892e9 * 0.53 / 150, unit: '개', what: '자동차 배터리(약 $150)', value: true }, note: '직접 고치는 손님(한 자릿수 초반 성장).' },
    ],
    facts: [
      { label: '매장 수', value: '약 6,700곳', note: '미국·멕시코·캐나다·푸에르토리코(외부 정리 자료 기준).' },
      { label: '매출 1달러당 순이익', value: '약 14센트', note: '순이익 약 7억(희석 EPS 0.86달러 × 약 8.1억 주) ÷ 매출 48.9억 달러.' },
    ],
    how: '오라일리는 사업이 하나라 정비소·일반 고객 매출을 따로 공개하지 않는다. 대략 47:53으로 나누고 순이익도 같은 비율로 나눴다(추정). 3분기 실적은 10월 28일 발표.',
  },
  HD: {
    period: '2026 회계연도 2분기(2026년 5~7월)', days: 91, src: '2026년 8월 회사 실적 발표·분기 보고서', profitLabel: '순이익',
    rows: [
      { name: '홈디포 매장·온라인', rev: 47.9e9, profit: 4.8e9, color: 'bg-orange-500', units: { n: 443.2e6, unit: '건', what: '계산대 결제(실제, 1건 평균 $92.50)' }, note: '미국·캐나다·멕시코 매장 2,300여 곳과 온라인, 시공업자용 유통(SRS) 포함(+5.7%).' },
    ],
    facts: [
      { label: '결제 1건당 회사 순이익', value: '약 $10.8', note: '순이익 48억 ÷ 결제 4.43억 건.' },
      { label: '시공업자 유통(SRS 등)', value: '+62%', note: '지붕·조경 업자용 유통 회사 인수 효과. 늘어난 매출의 약 4분의 3(외부 분석).' },
    ],
    how: '홈디포는 사업을 하나로 공개해 회사 순이익(48억 달러)을 그대로 썼다.',
  },
  ISRG: {
    period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-20 회사 실적 발표', profitLabel: '순이익(추정, 일회성 합의금 제외)',
    rows: [
      { name: '수술 기구·소모품', rev: 1.80e9, profit: 0.87e9 * 1.80 / 3.05, color: 'bg-sky-500', units: { n: 906000 + 49700, unit: '건', what: '로봇 수술(다빈치 약 90.6만 + 폐 검사 로봇 Ion 약 5만 건, 실제)' }, note: '수술 1건마다 새로 써야 하는 로봇 팔 도구·소모품(+18%). 수술이 늘면 자동으로 늘어나는 반복 매출.' },
      { name: '로봇 판매·리스', rev: 0.769e9, profit: 0.87e9 * 0.769 / 3.05, color: 'bg-indigo-500', units: { n: 546, unit: '대', what: '새로 설치한 다빈치 로봇(실제)' }, note: '다빈치 로봇 판매·리스(1년 전 5.9억 → 7.7억 달러). 이번 분기 546대 설치, 전 세계 1만 2,094대.' },
      { name: '정비 서비스', rev: 0.48e9, profit: 0.87e9 * 0.48 / 3.05, color: 'bg-gray-400', note: '설치된 로봇의 정비 계약(전체 매출에서 위 두 항목을 뺀 추정치).' },
    ],
    facts: [
      { label: '반복 매출 비중', value: '약 85%', note: '소모품 + 정비 + 리스처럼 해마다 다시 들어오는 매출이 대부분(회사 설명 기준 대략치).' },
      { label: '수술 1건당 회사 순이익', value: '약 $910', note: '순이익(합의금 제외) 약 8.7억 ÷ 수술 약 95.6만 건.' },
    ],
    how: '인튜이티브는 사업별 이익을 공개하지 않는다. 회계상 순이익(5.23억)에 반독점 소송 합의금(세후 3.47억 달러, 일회성)을 되돌린 약 8.7억 달러를 매출 비중대로 나눴다(추정). 실제로는 소모품 이익률이 로봇 판매보다 높다.',
  },
  ROL: {
    period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-21 회사 실적 발표·분기 보고서', profitLabel: '순이익(추정)',
    rows: [
      { name: '가정 방역', rev: 1.0897e9 * 0.45, profit: 158e6 * 0.45, color: 'bg-green-500', note: '집의 바퀴벌레·개미·쥐 정기 방역(+4.9%, 기존 고객만 보면 +2.3%). 성장이 가장 느려졌다.' },
      { name: '상업 방역', rev: 1.0897e9 * 0.33, profit: 158e6 * 0.33, color: 'bg-blue-500', note: '식당·병원·공장·호텔 방역(+7.7%).' },
      { name: '흰개미·기타', rev: 1.0897e9 * 0.22, profit: 158e6 * 0.22, color: 'bg-amber-600', note: '흰개미 방제·단열재 시공 등(+6.5%).' },
    ],
    facts: [
      { label: '매출 1달러당 순이익', value: '약 14.5센트', note: '순이익 1.58억 ÷ 매출 10.9억 달러. 보험·소송 비용이 늘어 1년 전보다 조금 줄었다.' },
      { label: '연속 매출 성장', value: '100분기 이상', note: '25년 넘게 매 분기 매출이 늘어난 회사(회사 발표 기준).' },
    ],
    how: '롤린스는 서비스별 매출 비중을 공개하지만 이번 분기 금액을 확인하지 못해, 최근 연간 비중(가정 약 45%·상업 약 33%·흰개미 약 22%)으로 매출을 나누고 순이익(1.58억 달러)도 같은 비율로 나눴다(추정).',
  },
  CPRT: {
    period: '2026 회계연도 4분기(2026년 5~7월)', days: 92, src: '2026-09-10 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '경매 수수료(서비스)', rev: 969.5e6, profit: 327.4e6 * 0.9, color: 'bg-blue-600', units: { n: 1e6, unit: '대', what: '경매로 판 차(연 약 400만 대 ÷ 4, 근사)' }, note: '보험사 사고차 등을 대신 경매로 팔아 주고 받는 수수료·보관료(+1.4%).' },
      { name: '직접 산 차 판매', rev: 182.9e6, profit: 327.4e6 * 0.1, color: 'bg-gray-500', note: '코파트가 직접 사서 되파는 차(+8.3%). 매출은 잡히지만 남는 돈은 적다.' },
    ],
    facts: [
      { label: '차 1대당 회사 순이익', value: '약 $330', note: '분기 순이익 3.27억 ÷ 경매 차 약 100만 대(근사).' },
      { label: '해외 판매 대수', value: '+10%', note: '미국은 −5.7%(보험 물량 감소)였지만 해외는 늘었다.' },
    ],
    how: '코파트는 미국·해외 두 부문을 공개하지만 이번 분기 부문 이익을 확인하지 못했다. 순이익(3.27억 달러)을 수수료 사업 90%, 차 판매 10%로 나눴다(차 판매는 남는 돈이 적다는 점을 반영한 추정).',
  },
  LII: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026년 7월 회사 실적 발표·분기 보고서', profitLabel: '순이익(추정)',
    rows: [
      { name: '가정용 냉난방', rev: 1.0e9, profit: 269e6 * 0.62, color: 'bg-orange-500', note: '집 에어컨·히트펌프·보일러(매출 −7%, 부문 이익 −3,000만 달러). 신축 주택 저마진 물량을 일부러 줄였다.' },
      { name: '상업용 냉난방', rev: 0.545e9, profit: 269e6 * 0.38, color: 'bg-sky-500', note: '건물·매장 옥상형 냉난방기(매출 +24%, 부문 이익 +3,500만 달러). 인수 효과 9% 포함.' },
    ],
    facts: [
      { label: '매출 1달러당 순이익', value: '약 17센트', note: '순이익 2.69억 ÷ 매출 15.45억 달러.' },
      { label: '부문 이익률', value: '23%', note: '전체 부문 이익 3.55억 ÷ 매출.' },
    ],
    how: '레녹스는 두 부문의 매출·이익을 공개하지만 이번 분기 금액을 확인하지 못해, 증가율로 거꾸로 계산한 추정 매출(가정용 약 10억·상업용 약 5.5억 달러)을 쓰고 순이익(2.69억 달러)은 약 62:38로 나눴다(추정). 3분기 실적은 10월 28일 발표.',
  },
  MCD: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026-08-04 회사 실적 발표·분기 보고서', profitLabel: '순이익(추정)',
    rows: [
      { name: '미국', rev: 0, profit: 1573e6 * 0.707, color: 'bg-red-500', note: '미국 매장(영업이익 15.7억 달러, +3%). 기존 매장 매출 +0.8%.' },
      { name: '해외 직영 시장', rev: 0, profit: 1723e6 * 0.707, color: 'bg-amber-400', note: '영국·독일·프랑스·호주·캐나다·일본 등 회사가 직접 관리하는 큰 시장(영업이익 17.2억 달러, +5%).' },
      { name: '해외 라이선스 시장·본사', rev: 0, profit: 42e6 * 0.707, color: 'bg-gray-400', note: '중국·중동·남미 등 현지 회사에 운영을 맡긴 시장 + 본사 비용(영업이익 0.4억 달러, −40%). 구조조정 비용 포함.' },
    ],
    facts: [
      { label: '회사 매출 1달러당 순이익', value: '약 33센트', note: '순이익 23.6억 ÷ 회사 매출 70.9억 달러. 매출 대부분이 가맹점 임대료·로열티라 많이 남는다.' },
      { label: '해외 이익 비중', value: '약 52%', note: '미국보다 해외에서 더 많이 번다.' },
    ],
    how: '맥도날드는 지역별 영업이익을 공개한다(지역별 매출은 이번 분기 숫자를 확인하지 못해 비워 둠). 각 영업이익에 회사 순이익 ÷ 영업이익(23.6억 ÷ 33.4억 = 0.707)을 곱했다(추정).',
  },
  MSFT: {
    period: '2026 회계연도 4분기(2026년 4~6월)', days: 91, src: '2026-07-29 회사 실적 발표·연차 보고서', profitLabel: '세후 영업이익(추정)',
    rows: [
      { name: '오피스·링크드인 등', rev: 37.8e9, profit: 21.9e9 * 0.82, color: 'bg-orange-500', note: '오피스(마이크로소프트 365)·팀즈·링크드인·다이내믹스(+14%). 영업이익률 58%로 가장 많이 남긴다.' },
      { name: '클라우드(애저 등)', rev: 39.3e9, profit: 16.0e9 * 0.82, color: 'bg-sky-500', note: '애저 클라우드·서버 소프트웨어(+32%, 애저만 +43%). AI 수요로 가장 빠르게 큰다.' },
      { name: '윈도·엑스박스·검색', rev: 12.9e9, profit: 2.7e9 * 0.82, color: 'bg-green-500', note: '윈도·서피스·엑스박스 게임·빙 검색 광고(−4%). 영업이익은 −14%.' },
    ],
    facts: [
      { label: '애저 성장률', value: '+43%', note: '애저 등 클라우드 서비스 매출이 1년 새 43% 늘었다.' },
      { label: '매출 1달러당 영업이익', value: '약 45센트', note: '영업이익 406억 ÷ 매출 900억 달러.' },
    ],
    how: '마이크로소프트는 세 부문의 영업이익을 공개한다(윈도·엑스박스 부문은 전체 영업이익에서 나머지 두 부문을 빼서 구함). 각 영업이익에서 세금 약 18%를 뺐다(추정).',
  },
  NVDA: {
    period: '2027 회계연도 2분기(2026년 4~7월)', days: 91, src: '2026-08-26 회사 실적 발표·분기 보고서', profitLabel: '세후 영업이익(추정)',
    rows: [
      { name: 'AI 데이터센터(빅테크)', rev: 48.7e9, profit: 63.7e9 * 0.85 * 48.7 / 96.2, color: 'bg-green-600', units: { n: 48.7e9 / 35000, unit: '개', what: 'AI 칩(GPU 1개 약 $35,000 가정)', value: true }, note: '마이크로소프트·구글·아마존·메타 같은 초대형 클라우드 회사가 사는 AI 칩·서버(1년 전 242억 → 487억 달러).' },
      { name: 'AI 데이터센터(기타 기업·AI 클라우드)', rev: 40.3e9, profit: 63.7e9 * 0.85 * 40.3 / 96.2, color: 'bg-emerald-400', units: { n: 40.3e9 / 35000, unit: '개', what: 'AI 칩(GPU 1개 약 $35,000 가정)', value: true }, note: 'AI 전문 클라우드·일반 기업·각국 정부(1년 전 169억 → 403억 달러).' },
      { name: '게임·PC·자동차 등', rev: 7.2e9, profit: 63.7e9 * 0.85 * 7.2 / 96.2, color: 'bg-gray-500', units: { n: 7.2e9 / 1999, unit: '개', what: 'RTX 5090 그래픽카드($1,999)', value: true }, note: '게임용 그래픽카드·작업용 PC·자율주행 칩 등(엣지 컴퓨팅, 1년 전 56억 → 72억 달러).' },
    ],
    facts: [
      { label: '데이터센터 비중', value: '93%', note: '엔비디아 매출 거의 전부가 AI 데이터센터에서 나온다.' },
      { label: '매출 1달러당 영업이익', value: '약 66센트', note: '영업이익 637억 ÷ 매출 962억 달러. 세계에서 가장 많이 남기는 대기업 수준.' },
    ],
    how: '엔비디아는 시장별 매출만 공개하고 이익은 회사 전체로 낸다. 영업이익(637억 달러)에서 세금 약 15%를 뺀 값을 매출 비중대로 나눴다(추정). 회계상 순이익(597억)에는 보유 주식 평가 이익이 섞여 있어 쓰지 않았다. AI 칩 개수는 GPU 1개 약 $35,000로 가정한 &lsquo;몇 개 값&rsquo;이다(실제로는 서버·네트워크 장비가 섞여 있다).',
  },
  META: {
    period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-21 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '앱(페이스북·인스타·왓츠앱)', rev: 64.16e9, profit: 17.12e9 * 0.762, color: 'bg-blue-600', note: '광고가 거의 전부(매출 +26%). 영업이익은 −31%: 미국 주 정부들과의 소송 합의금 98.9억 달러(일회성) 때문.' },
      { name: '리얼리티랩(VR·AR 안경)', rev: 0.443e9, profit: -4.13e9 * 0.762, color: 'bg-purple-500', note: '퀘스트 VR·레이밴 스마트 안경 등. 분기마다 40억 달러 넘게 손해(1년 전 44억 손실보다 조금 줄었다).' },
    ],
    facts: [
      { label: '하루 쓰는 사람 1명당 분기 매출', value: '약 $18', note: '매출 646억 ÷ 하루 쓰는 사람 약 36억 명.' },
      { label: '일회성 합의금 빼면', value: '주당 순이익 $7.40', note: '합의금 98.9억 달러를 빼면 이번 분기 주당 순이익은 $3.83이 아니라 $7.40.' },
    ],
    how: '메타는 앱·리얼리티랩 두 부문의 영업이익을 공개한다. 각 영업이익에 회사 순이익 ÷ 영업이익(99억 ÷ 129.9억 = 0.762)을 곱했다(추정). 이번 분기 앱 이익에는 일회성 소송 합의금이 들어가 평소보다 작다.',
  },
  AVGO: {
    period: '2026 회계연도 3분기(2026년 5~8월)', days: 91, src: '2026-09-03 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: 'AI 칩(맞춤형 칩·네트워크)', rev: 16.7e9, profit: 13.1e9 * 16.7 / 29.59, color: 'bg-red-500', note: '구글 TPU 같은 빅테크 맞춤형 AI 칩과 AI 네트워크 칩(+221%, 1년 새 3.2배).' },
      { name: '일반 반도체', rev: 4.14e9, profit: 13.1e9 * 4.14 / 29.59, color: 'bg-orange-300', note: '스마트폰 무선 칩·저장장치·통신 칩 등.' },
      { name: '소프트웨어(VMware 등)', rev: 8.75e9, profit: 13.1e9 * 8.75 / 29.59, color: 'bg-sky-500', note: '기업 서버 가상화(VMware)·보안 소프트웨어(+29%). 보통 반도체보다 이익률이 높다.' },
    ],
    facts: [
      { label: 'AI 칩 비중', value: '56%', note: '매출 296억 중 AI 칩 167억 달러. 다음 분기 217억 예상.' },
      { label: '매출 1달러당 순이익', value: '약 44센트', note: '순이익 약 131억(희석 EPS 2.68달러 × 약 49억 주) ÷ 매출 296억 달러.' },
    ],
    how: '브로드컴은 반도체·소프트웨어 두 부문 이익을 내지만 이번 분기 숫자를 확인하지 못해, 순이익(약 131억 달러)을 매출 비중대로 나눴다(추정). 소프트웨어 몫은 실제보다 작게 잡혔을 가능성이 크다.',
  },
  TSLA: {
    period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-21 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '자동차', rev: 20.56e9, profit: 0.787e9 * 20.56 / 28.05, color: 'bg-red-600', units: { n: 486532, unit: '대', what: '인도한 차(실제 대수)' }, note: '차 판매·탄소 배출권(매출 약 206억 달러). 자동차 매출총이익률(배출권 제외) 약 18%.' },
      { name: '에너지(메가팩 등)', rev: 2.88e9, profit: 0.787e9 * 2.88 / 28.05, color: 'bg-green-500', units: { n: 13.7e6, unit: 'kWh', what: '설치한 배터리 용량 13.7GWh(실제)' }, note: '대형 저장용 배터리 메가팩·가정용 파워월(−16%).' },
      { name: '서비스·기타', rev: 4.61e9, profit: 0.787e9 * 4.61 / 28.05, color: 'bg-gray-500', note: '정비·충전(슈퍼차저)·보험·중고차·FSD 구독 등.' },
    ],
    facts: [
      { label: '매출 1달러당 순이익', value: '약 2.8센트', note: '순이익 7.9억 ÷ 매출 280억 달러. AI·로봇(옵티머스) 연구비가 39% 늘어 이익이 크게 줄었다.' },
      { label: '차 1대당 회사 순이익', value: '약 $1,600', note: '순이익 7.9억 ÷ 인도 48.7만 대(회사 전체 이익 기준).' },
    ],
    how: '테슬라는 자동차·에너지 두 부문 이익을 내지만 이번 분기 숫자를 확인하지 못해, 순이익(7.9억 달러)을 매출 비중대로 나눴다(추정). 실제로는 에너지 이익률이 자동차보다 높다.',
  },
  AMZN: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026-07-30 회사 실적 발표', profitLabel: '세후 영업이익(추정)',
    rows: [
      { name: '북미 쇼핑', rev: 116200000000.0, profit: 9.1e9 * 0.83, color: 'bg-amber-500', note: '미국·캐나다 온라인 쇼핑·판매자 수수료·광고·프라임 구독(매출 +16%, 영업이익 91억 달러). 프라임데이가 이번 분기로 옮겨 온 효과 포함.' },
      { name: '해외 쇼핑', rev: 42200000000.0, profit: 1.7e9 * 0.83, color: 'bg-orange-300', note: '미국 밖 쇼핑·광고·구독(매출 +15%, 영업이익 17억 달러). 매출은 크지만 남는 돈은 적다.' },
      { name: 'AWS(클라우드)', rev: 42200000000.0, profit: 16.6e9 * 0.83, color: 'bg-sky-500', note: '기업에 서버·AI를 빌려주는 사업(매출 +37%, 영업이익 166억 달러). 매출의 21%로 이익의 60%를 번다.' },
    ],
    facts: [
      { label: 'AWS 이익 비중', value: '매출 21% → 이익 60%', note: '아마존 이익의 대부분은 쇼핑이 아니라 클라우드에서 나온다.' },
      { label: '쇼핑 1달러당 남는 돈', value: '약 6센트', note: '북미+해외 쇼핑 영업이익(108억) ÷ 매출(1,584억 달러) ≈ 6.8%, 세금 빼면 약 5.6센트.' },
    ],
    how: '아마존은 북미·해외·AWS 세 부문의 영업이익을 공개한다. 각 영업이익에서 세금 17%를 뺐다(추정). 이번 분기 회계상 순이익(626억 달러)에는 앤트로픽 지분 평가 이익 534억 달러가 섞여 있어 쓰지 않았다.',
  },
  NFLX: {
    period: '2026년 3분기(7~9월)', days: 92, src: '2026년 10월 회사 실적 발표·분기 보고서', profitLabel: '순이익(추정)',
    rows: [
      { name: '미국·캐나다', rev: 5628000000.0, profit: 3.66e9 * 5.628 / 12.874, color: 'bg-red-600', note: '매출 +11%. 가장 큰 시장(44%).' },
      { name: '유럽·중동·아프리카', rev: 4107000000.0, profit: 3.66e9 * 4.107 / 12.874, color: 'bg-indigo-400', note: '매출 +11%.' },
      { name: '중남미', rev: 1603000000.0, profit: 3.66e9 * 1.603 / 12.874, color: 'bg-green-500', note: '매출 +17%, 가장 빠르게 큰다.' },
      { name: '아시아·태평양', rev: 1537000000.0, profit: 3.66e9 * 1.537 / 12.874, color: 'bg-amber-500', note: '매출 +12%(환율 빼면 +15%).' },
    ],
    facts: [
      { label: '매출 1달러당 순이익', value: '약 28센트', note: '순이익 36.6억 ÷ 매출 128.7억 달러. 콘텐츠를 한 번 만들면 전 세계에 팔 수 있어 남는 돈이 크다.' },
      { label: '1초에 재생되는 시간', value: '약 6,200시간', note: '2026년 상반기 시청 970억 시간 ÷ 초.' },
    ],
    how: '넷플릭스는 지역별 매출만 공개하고 이익은 회사 전체로만 낸다. 순이익(36.6억 달러)을 지역 매출 비중대로 나눴다(추정).',
  },
  NOW: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026년 7월 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '구독(소프트웨어 사용료)', rev: 3877000000.0, profit: 298e6 * 2847 / 2818, color: 'bg-emerald-500', note: '기업들이 IT·인사·고객지원 업무를 처리하는 소프트웨어 사용료(+24.5%). 매출총이익률 73.5%.' },
      { name: '컨설팅(설치 도움)', rev: 110000000.0, profit: 298e6 * -29 / 2818, color: 'bg-gray-400', note: '도입을 도와주는 전문 서비스(+8.5%). 고객을 붙잡기 위해 손해(매출총이익률 −26.5%)를 보며 한다.' },
    ],
    facts: [
      { label: '구독 매출 비중', value: '97%', note: '매출의 거의 전부가 해마다 다시 들어오는 구독료.' },
      { label: '회계상 이익률', value: '약 7.5%', note: '순이익 2.98억 ÷ 매출 39.9억 달러. 직원 주식 보상 비용이 커서 회계상 이익이 작다(일회성 비용 뺀 영업이익률은 29.5%).' },
    ],
    how: '서비스나우는 사업별 순이익을 공개하지 않는다. 순이익(2.98억 달러)을 구독·컨설팅의 매출총이익(구독 28.47억, 컨설팅 −0.29억 달러) 비중으로 나눴다(추정).',
  },
  MA: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026년 7월 회사 실적 발표·분기 보고서', profitLabel: '순이익(추정)',
    rows: [
      { name: '결제망 수수료', rev: 5451000000.0, profit: 4.39e9 * 5451 / 9277, color: 'bg-orange-500', units: { n: 47.4e9, unit: '건', what: '마스터카드 결제' }, note: '카드가 긁힐 때마다 받는 수수료(+10%). 결제 474억 건, 금액 2.9조 달러.' },
      { name: '부가 서비스', rev: 3826000000.0, profit: 4.39e9 * 3826 / 9277, color: 'bg-amber-400', note: '사기 방지·본인 인증·데이터 분석·마케팅 서비스(+20%). 결제망보다 두 배 빠르게 큰다.' },
    ],
    facts: [
      { label: '결제 1건당 매출', value: '약 19.6센트', note: '순매출 92.8억 ÷ 결제 474억 건.' },
      { label: '결제 1건당 순이익', value: '약 9.3센트', note: '순이익 43.9억 ÷ 결제 474억 건.' },
    ],
    how: '마스터카드는 사업별 이익을 공개하지 않는다. 순이익(43.9억 달러)을 두 사업의 매출 비중대로 나눴다(추정).',
  },
  TPL: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026년 7월 회사 실적 발표·분기 보고서', profitLabel: '순이익(추정)',
    rows: [
      { name: '땅·석유 로열티', rev: 163900000.0, profit: 136.3e6 * 0.8024, color: 'bg-amber-600', note: '텍사스 서부의 넓은 땅(약 87만 에이커)을 가지고 있다. 석유·가스 회사가 뽑아 갈 때마다 로열티와 땅 사용료를 받는다(매출 +28%).' },
      { name: '물 사업', rev: 82200000.0, profit: 55.5e6 * 0.8024, color: 'bg-sky-500', note: '유전에 쓰는 물을 팔고, 나온 폐수를 처리해 준다(매출 +39%).' },
    ],
    facts: [
      { label: '매출 100달러 중 영업이익', value: '약 78달러', note: '영업이익 1.92억 ÷ 매출 2.46억 달러. 땅을 빌려줄 뿐 직접 시추하지 않아 비용이 거의 없다.' },
      { label: '물 사업 매출 비중', value: '33%', note: '물 사업이 1년 전보다 39% 늘어 땅 로열티(+28%)보다 빠르게 크고 있다.' },
    ],
    how: '텍사스 퍼시픽 랜드는 두 사업의 영업이익을 공개한다. 각 영업이익에 회사 순이익 ÷ 영업이익(1.539 ÷ 1.918 = 0.80)을 곱했다(추정).',
  },
  ANET: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026년 8월 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '네트워크 장비', rev: 2605200000.0, profit: 1212.9e6 * 2605.2 / 3035.7, color: 'bg-blue-600', note: '데이터센터·AI 서버를 잇는 스위치(+40% 안팎). 마이크로소프트·메타 같은 큰 손님이 매출의 큰 몫.' },
      { name: '유지보수·소프트웨어', rev: 430500000.0, profit: 1212.9e6 * 430.5 / 3035.7, color: 'bg-sky-400', note: '장비 고장 지원·소프트웨어 업데이트 계약.' },
    ],
    facts: [
      { label: '매출 1달러당 순이익', value: '약 40센트', note: '순이익 12.1억 ÷ 매출 30.4억 달러. 하드웨어 회사인데도 소프트웨어 회사만큼 남긴다.' },
      { label: '올해 매출 전망', value: '약 126억 달러(+40%)', note: '회사가 올린 2026년 전망.' },
    ],
    how: '아리스타는 사업별 이익을 공개하지 않는다. 순이익(12.1억 달러)을 매출 비중대로 나눴다(추정).',
  },
  VEEV: {
    period: '2027 회계연도 2분기(2026년 5~7월)', days: 92, src: '2026-08-26 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '영업·마케팅용 구독', rev: 347400000.0, profit: 273.4e6 * 347.4 / 928, color: 'bg-orange-500', note: '제약회사 영업사원용 고객 관리(CRM) 소프트웨어 사용료.' },
      { name: '연구개발·품질용 구독', rev: 419400000.0, profit: 273.4e6 * 419.4 / 928, color: 'bg-emerald-500', note: '신약 임상시험·허가 서류·품질 관리 소프트웨어 사용료. 지금은 이쪽이 더 크다.' },
      { name: '컨설팅', rev: 161200000.0, profit: 273.4e6 * 161.2 / 928, color: 'bg-gray-400', note: '도입·운영을 도와주는 서비스. 실제로는 이익률이 구독보다 훨씬 낮다.' },
    ],
    facts: [
      { label: '구독 매출 비중', value: '83%', note: '매출 9.28억 중 구독 7.67억 달러(+16%).' },
      { label: '매출 1달러당 순이익', value: '약 29센트', note: '순이익 2.73억 ÷ 매출 9.28억 달러.' },
    ],
    how: '비바는 사업별 순이익을 공개하지 않는다. 순이익(2.73억 달러)을 매출 비중대로 나눴다(추정). 컨설팅 몫은 실제보다 크게, 구독 몫은 작게 잡혔을 가능성이 크다.',
  },
  IDXX: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026-08-04 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '반려동물 진단', rev: 1120000000.0, profit: 342e6 * 1120 / 1216.6, color: 'bg-emerald-500', note: '동물병원 혈액검사 장비·검사 키트·검사 대행·병원 소프트웨어(+9%). 장비를 깔면 키트를 계속 사야 해서 매출이 반복된다.' },
      { name: '수질 검사', rev: 58600000.0, profit: 342e6 * 58.6 / 1216.6, color: 'bg-sky-500', note: '수돗물·하천의 대장균 검사 키트(+15%).' },
      { name: '가축·가금 진단', rev: 35200000.0, profit: 342e6 * 35.2 / 1216.6, color: 'bg-amber-500', note: '소·돼지·닭 질병 검사(+11%).' },
      { name: '기타', rev: 2800000.0, profit: 342e6 * 2.8 / 1216.6, color: 'bg-gray-400', note: '기타 사업.' },
    ],
    facts: [
      { label: '반려동물 비중', value: '92%', note: '회사 매출의 대부분이 동물병원에서 나온다.' },
      { label: '매출 1달러당 순이익', value: '약 28센트', note: '순이익 약 3.4억(희석 EPS 4.27달러 × 약 8천만 주) ÷ 매출 12.2억 달러.' },
    ],
    how: '아이덱스는 사업별 순이익을 공개하지 않는다. 순이익(약 3.4억 달러)을 매출 비중대로 나눴다(추정).',
  },
  MPWR: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026년 7월 회사 실적 발표·분기 보고서', profitLabel: '순이익(추정)',
    rows: [
      { name: 'AI 서버·데이터센터', rev: 380600000.0, profit: 257.3e6 * 380.6 / 980.6, color: 'bg-violet-500', note: 'AI 서버에 들어가는 전력 칩(+164%). 지금 성장의 거의 전부.' },
      { name: '저장장치·컴퓨터', rev: 199800000.0, profit: 257.3e6 * 199.8 / 980.6, color: 'bg-blue-500', note: '노트북·SSD 등(+2%).' },
      { name: '자동차', rev: 157100000.0, profit: 257.3e6 * 157.1 / 980.6, color: 'bg-gray-600', note: '자동차 전장 전력 칩(+8%).' },
      { name: '통신', rev: 131500000.0, profit: 257.3e6 * 131.5 / 980.6, color: 'bg-sky-400', note: '통신 장비(+78%).' },
      { name: '소비자 기기', rev: 56800000.0, profit: 257.3e6 * 56.8 / 980.6, color: 'bg-pink-400', note: '가전·게임기(−5%).' },
      { name: '산업', rev: 54800000.0, profit: 257.3e6 * 54.8 / 980.6, color: 'bg-amber-500', note: '산업 장비(+17%).' },
    ],
    facts: [
      { label: 'AI 서버 비중', value: '39%', note: '1년 전 약 22%에서 크게 늘었다. AI 투자가 꺾이면 가장 먼저 흔들릴 부분.' },
      { label: '매출 1달러당 순이익', value: '약 26센트', note: '순이익 2.57억 ÷ 매출 9.81억 달러.' },
    ],
    how: '모놀리식 파워는 하나의 사업만 공개하고, 매출만 쓰는 곳(시장)별로 나눠 낸다. 순이익(2.57억 달러)을 매출 비중대로 나눴다(추정).',
  },
  PANW: {
    period: '2026 회계연도 4분기(2026년 5~7월)', days: 92, src: '2026-09-01 회사 실적 발표', profitLabel: '조정 순이익(추정)',
    rows: [
      { name: '구독·유지보수', rev: 2730000000.0, profit: 853e6 * 0.8, color: 'bg-orange-500', note: '방화벽 위에서 돌아가는 보안 구독·클라우드 보안·유지보수(연간 약 80%). 해마다 다시 들어오는 돈.' },
      { name: '방화벽 장비', rev: 680000000.0, profit: 853e6 * 0.2, color: 'bg-gray-500', note: '네트워크 방화벽 장비 판매(약 20%).' },
    ],
    facts: [
      { label: '차세대 보안 연간 매출(ARR)', value: '91억 달러(+63%)', note: '클라우드·AI 보안 같은 새 사업의 1년 치 계약 금액.' },
      { label: '회계상 순이익', value: '−2.8억 달러(적자)', note: '인수 관련 비용 때문에 이번 분기 회계상으로는 적자다. 위 표는 일회성 비용을 뺀 조정 순이익(8.5억 달러)을 썼다.' },
    ],
    how: '팔로알토는 분기별 사업 이익을 공개하지 않고, 이번 분기에는 구독·장비 매출 비율도 확인하지 못해 연간 비율(구독 약 80%)을 썼다. 회계상 순손실 대신 조정 순이익(8.5억 달러)을 매출 비중대로 나눴다(추정).',
  },
  ODFL: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026년 7월 회사 실적 발표', profitLabel: '순이익',
    rows: [
      { name: '소량 화물 트럭 운송(LTL)', rev: 1554000000.0, profit: 350.6e6, color: 'bg-green-600', note: '여러 회사의 작은 화물을 한 트럭에 모아 실어 나르는 운송. 회사 매출의 거의 전부(+10%).' },
    ],
    facts: [
      { label: '매출 100달러 중 비용', value: '70.1달러', note: '운영비율 70.1%(1년 전 74.6%). 업계 최저 수준이라 남는 돈이 크다.' },
      { label: '매출 1달러당 순이익', value: '약 23센트', note: '순이익 3.51억 ÷ 매출 15.5억 달러.' },
    ],
    how: '올드 도미니언은 사업이 하나뿐이라 회사 순이익을 그대로 썼다.',
  },
  NKE: {
    period: '2027 회계연도 1분기(2026년 6~8월)', days: 92, src: '2026-10-01 회사 실적 발표', profitLabel: '순이익(추정)',
    rows: [
      { name: '북미', rev: 5.13e9, profit: 1.17e9 * 0.785, color: 'bg-blue-500', note: '매출 +2%, 지역 이익(EBIT) +3%. 러닝·축구·농구 같은 운동용 제품이 살아났다.' },
      { name: '유럽·중동·아프리카', rev: 3.18e9, profit: 0.728e9 * 0.785, color: 'bg-indigo-400', note: '매출 −5%(신발 −11%), 지역 이익 −1%.' },
      { name: '중화권', rev: 1.2e9, profit: 0.248e9 * 0.785, color: 'bg-red-500', note: '매출 −22%, 지역 이익 −34%. 재고를 줄이느라 일부러 덜 팔고 있다.' },
      { name: '아시아·태평양·중남미', rev: 1.5e9, profit: 0.324e9 * 0.785, color: 'bg-amber-500', note: '매출 −2%(환율 빼면 제자리), 지역 이익 −7%.' },
      { name: '컨버스', rev: 0.263e9, profit: 0.025e9 * 0.785, color: 'bg-gray-500', note: '척테일러 등 컨버스 브랜드. 매출 −28%, 이익 −36%.' },
      { name: '브랜드 공통 비용', rev: 0, profit: -1.11e9 * 0.785, color: 'bg-gray-300', note: '광고·스폰서(운동선수 계약)·디자인 등 지역에 나누지 않은 나이키 브랜드 비용(1년 전보다 7% 줄임).' },
      { name: '본사 비용', rev: 0, profit: -0.478e9 * 0.785, color: 'bg-gray-300', note: '본사 관리비·환율 손익 등.' },
    ],
    facts: [
      { label: '에어포스 1 한 켤레 팔면 남는 돈', value: '약 $7', note: '에어포스 1 미국 정가($115) × 이번 분기 순이익률(약 6.4% = 순이익 7.1억 ÷ 매출 112억 달러). 도매로 팔리면 이보다 적다.' },
      { label: '중화권 이익', value: '1년 새 −34%', note: '한때 가장 빠르게 크던 중국이 지금은 가장 크게 줄고 있다.' },
    ],
    how: '나이키는 지역별 이익(EBIT, 이자·세금 전 이익)을 공개한다. 지역별 EBIT에 회사 전체 순이익 ÷ 전체 EBIT 비율(7.1억 ÷ 9.07억 = 0.785)을 곱해 순이익으로 바꿨다(추정).',
    products: {
      title: '제품별 매출 — 무엇을 팔아서 버나',
      note: '나이키는 제품별로는 매출만 공개한다(이익은 지역별로만). 의류 매출은 나이키 브랜드 매출(110억)에서 신발·장비를 뺀 값(추정). 판매 개수는 매출 ÷ 대표 상품 미국 정가 = &lsquo;몇 개 값&rsquo;이고, 매출이 도매가 기준이라 실제 개수는 이보다 많다.',
      rows: [
        { name: '신발', rev: 6.95e9, profit: 0, color: 'bg-orange-500', units: { n: 6.95e9 / 115, unit: '켤레', what: '에어포스 1($115)', value: true }, note: '매출 −6%로 가장 약한 부분(조던 포함). 에어포스 1·덩크 같은 오래된 인기 모델 판매를 일부러 줄이는 중.' },
        { name: '의류', rev: 3.43e9, profit: 0, color: 'bg-sky-500', units: { n: 3.43e9 / 35, unit: '장', what: '기본 티셔츠(약 $35)', value: true }, note: '운동복·후드·레깅스 등(+2% 안팎). 나이키 브랜드 매출 − 신발 − 장비로 계산한 추정치.' },
        { name: '장비', rev: 0.611e9, profit: 0, color: 'bg-green-500', units: { n: 0.611e9 / 35, unit: '개', what: '축구공(약 $35)', value: true }, note: '공·가방·양말·장갑 등(−3%).' },
        { name: '컨버스', rev: 0.263e9, profit: 0, color: 'bg-gray-500', units: { n: 0.263e9 / 65, unit: '켤레', what: '척테일러 올스타(약 $65)', value: true }, note: '컨버스 브랜드 전체(−28%).' },
      ],
    },
  },
  RMS: {
    period: '2026년 상반기(1~6월)', days: 181, src: '2026-07-29 회사 반기 실적 발표', cur: '€', profitLabel: '세후 영업이익(추정)',
    rows: [
      { name: '가죽·마구(버킨·켈리 등)', rev: 3761e6, profit: 3761e6 * 0.41 * 0.72, color: 'bg-orange-500', units: { n: 3761e6 / 10600, unit: '개', what: '버킨 30(€10,600)', value: true }, note: '매출 +9.8%(환율 빼고), 회사 매출의 46%. 공방(가죽 장인)을 늘린 만큼 판다. 실제 이익률은 다른 사업보다 높을 가능성이 크다(회사 미공개).' },
      { name: '의류·액세서리', rev: 2198e6, profit: 2198e6 * 0.41 * 0.72, color: 'bg-sky-500', units: { n: 2198e6 / 635, unit: '켤레', what: '오란 샌들(€635)', value: true }, note: '옷·신발·벨트·모자 등. 매출 +2.0%(환율 빼고, 유로로는 −2.5%).' },
      { name: '실크·텍스타일', rev: 469e6, profit: 469e6 * 0.41 * 0.72, color: 'bg-pink-400', units: { n: 469e6 / 530, unit: '장', what: '까레 90 실크 스카프(€530)', value: true }, note: '스카프·넥타이 등. 매출 +9.7%(환율 빼고).' },
      { name: '향수·뷰티', rev: 233e6, profit: 233e6 * 0.41 * 0.72, color: 'bg-violet-400', units: { n: 233e6 / 128, unit: '병', what: '떼르 데르메스 향수 100ml(약 €128)', value: true }, note: '향수·립스틱 등(약 2.3억 유로, 외부 정리 자료 기준).' },
      { name: '보석·홈·시계 등', rev: 1502e6, profit: 1502e6 * 0.41 * 0.72, color: 'bg-gray-400', units: { n: 1502e6 / 660, unit: '개', what: '클릭 H 팔찌(€660)', value: true }, note: '보석·그릇·가구·시계·기타(전체에서 위 사업을 뺀 나머지).' },
    ],
    facts: [
      { label: '버킨 하나 팔면 남는 돈', value: '약 €3,100', note: '버킨 30 유럽 정가(€10,600) × 세후 영업이익률(약 29.5% = 영업이익률 41% × (1 − 세율 약 28%)). 가죽 이익률이 더 높다면 실제로는 이보다 많다.' },
      { label: '영업이익률', value: '41.0%', note: '2026년 상반기. 매출 100유로 중 41유로가 영업이익으로 남는다(세계 명품 회사 중 최고 수준).' },
    ],
    how: '에르메스는 사업별 이익을 공개하지 않는다(지역별 영업이익도 확인하지 못했다). 상반기 영업이익(매출의 41.0%)에서 세금 약 28%를 뺀 이익을 사업별 매출 비중대로 나눴다(모든 사업의 이익률이 같다고 가정한 추정). 그래서 &lsquo;이익 비중&rsquo;은 사실상 매출 비중과 같다.',
  },

  GOOGL: {
    period: '2026년 2분기(4~6월)', days: 91, src: '2026년 7월 회사 실적 발표·분기 보고서', profitLabel: '세후 영업이익(추정)',
    rows: [
      { name: '검색 광고', rev: 63.3e9, profit: 26.46e9 * 0.83, color: 'bg-blue-500', units: { n: 5e12 * 91 / 365, unit: '회', what: '구글 검색' }, note: '구글 검색·지도 등에 붙는 광고(1년 전보다 +17%).' },
      { name: '유튜브 광고', rev: 11.1e9, profit: 4.64e9 * 0.83, color: 'bg-red-500', note: '유튜브 영상·쇼츠 광고(+13%). 유튜브 프리미엄 구독료는 아래 구독에 들어간다.' },
      { name: '다른 사이트 광고(네트워크)', rev: 7.2e9, profit: 3.01e9 * 0.83, color: 'bg-amber-500', note: '구글이 다른 웹사이트·앱에 대신 붙여 주는 광고(−1%). 대부분을 사이트 주인에게 나눠 줘서 이익이 적다(그래도 매출 비중으로 나눠 실제보다 크게 잡혔을 수 있다).' },
      { name: '구독·플레이스토어·기기', rev: 12.9e9, profit: 5.39e9 * 0.83, color: 'bg-green-500', note: '유튜브 프리미엄·구글 원·플레이스토어 수수료·픽셀폰 등(+15%).' },
      { name: '클라우드', rev: 24.8e9, profit: 8.8e9 * 0.83, color: 'bg-sky-500', note: '기업에 서버·AI를 빌려주는 사업(매출 +82%, 영업이익률 35.6%). 회사가 이익을 따로 공개한다.' },
      { name: '기타 사업(웨이모 등)', rev: 0.382e9, profit: -1.8e9 * 0.83, color: 'bg-gray-400', note: '자율주행 웨이모·생명과학 등. 아직 적자(분기 약 18억 달러 손실).' },
      { name: '회사 공통 비용', rev: 0, profit: -5.7e9 * 0.83, color: 'bg-gray-300', note: 'AI 연구(구글 딥마인드)·본사 비용 등 사업부에 나누지 않은 비용.' },
    ],
    facts: [
      { label: '검색 1번당 매출', value: '약 5.1센트', note: '검색 광고 1초 매출(약 $8,050) ÷ 1초 검색 수(약 15.9만 회, 회사 발표 연 5조 회 기준). 검색 수는 2024년 기준이라 실제 1번당 값은 이보다 조금 작다.' },
      { label: '검색 1번당 이익', value: '약 1.7센트', note: '검색 광고 세후 이익(추정)을 같은 검색 수로 나눈 값.' },
    ],
    how: '이익은 회사가 &lsquo;구글 서비스(검색·유튜브·네트워크·구독)&rsquo;, &lsquo;클라우드&rsquo;, &lsquo;기타 사업&rsquo;으로만 공개한다. 구글 서비스 영업이익(395억 달러)을 네 사업에 매출 비중대로 나눴고(추정), 세금 17%를 뺐다. 이번 분기 회계상 순이익(1,120억 달러)에는 보유 주식 평가 이익 980억 달러가 섞여 있어 쓰지 않았다.',
  },
  AAPL: {
    period: '2026 회계연도 3분기(2026년 4~6월)', days: 91, src: '2026년 7월 회사 실적 발표·분기 보고서', profitLabel: '순이익(추정)',
    rows: [
      { name: '아이폰', rev: 54.25e9, profit: 11.83e9, color: 'bg-gray-700', units: { n: 54.25e9 / 799, unit: '대', what: '아이폰 17($799)', value: true }, note: '매출 +22%, 6월 분기 사상 최대.' },
      { name: '맥', rev: 10.35e9, profit: 2.26e9, color: 'bg-blue-500', units: { n: 10.35e9 / 999, unit: '대', what: '맥북 에어($999)', value: true }, note: '매출 +29%.' },
      { name: '아이패드', rev: 6.2e9, profit: 1.35e9, color: 'bg-indigo-400', units: { n: 6.2e9 / 349, unit: '대', what: '아이패드($349)', value: true }, note: '매출 −6%.' },
      { name: '워치·에어팟 등', rev: 7.9e9, profit: 1.72e9, color: 'bg-pink-400', units: { n: 7.9e9 / 129, unit: '개', what: '에어팟 4($129)', value: true }, note: '매출 +6.5%.' },
      { name: '서비스(앱스토어 등)', rev: 30.7e9, profit: 12.64e9, color: 'bg-emerald-500', note: '매출 +12%. 매출총이익률 75.6%로 제품(40.1%)의 약 2배라, 매출은 28%인데 이익은 42%를 차지한다.' },
    ],
    facts: [
      { label: '기기 1대당 서비스 매출', value: '1년 약 $49', note: '서비스 매출(분기 307억 달러 × 4) ÷ 사용 중인 애플 기기 25억 대(2026년 1월 회사 발표).' },
      { label: '서비스 이익 비중', value: '매출 28% → 이익 42%', note: '서비스는 적게 팔아도 많이 남는다. 애플 주가가 비싸게 거래되는 큰 이유.' },
    ],
    how: '애플은 사업별 순이익을 공개하지 않는다. 회사 순이익(298억 달러)을 제품·서비스의 매출총이익(제품 315억·서비스 232억 달러) 비중으로 나누고, 제품 몫은 다시 아이폰·맥·아이패드·웨어러블 매출 비중으로 나눴다(추정).',
  },
}

// 스크롤 상자 안에서도 잘리지 않는 툴팁: 화면 기준(fixed)으로 띄움
function FTip({ children, text }: { children: ReactNode; text: ReactNode }) {
  const [pos, setPos] = useState<{ x: number; y: number; up: boolean } | null>(null)
  const show = (e: React.MouseEvent | React.FocusEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const up = r.top > window.innerHeight / 2
    setPos({ x: Math.max(8, Math.min(r.left, window.innerWidth - 272)), y: up ? window.innerHeight - r.top + 6 : r.bottom + 6, up })
  }
  return (
    <span className="inline-flex items-center cursor-help" tabIndex={0} onMouseEnter={show} onMouseLeave={() => setPos(null)} onFocus={show} onBlur={() => setPos(null)}>
      {children}<span className="ml-0.5 text-gray-400">?</span>
      {pos && (
        <span style={{ position: 'fixed', left: pos.x, ...(pos.up ? { bottom: pos.y } : { top: pos.y }) }}
          className="z-[100] w-64 max-w-[calc(100vw-1rem)] pointer-events-none whitespace-normal text-left font-normal bg-gray-900 text-white text-xs rounded-md px-2.5 py-2 shadow-lg leading-relaxed">
          {text}
        </span>
      )}
    </span>
  )
}

function SegmentPanel({ seg, now, shares, sharesOut }: { seg: SegClock; now: number; shares: number; sharesOut: number }) {
  const startOfDay = new Date(new Date(now).setHours(0, 0, 0, 0)).getTime()
  const secs = seg.days * 86400
  const today = (now - startOfDay) / 1000
  const mine = shares / sharesOut
  const usd = (v: number, d = 0) => `${v < 0 ? '−' : ''}${seg.cur ?? '$'}${Math.abs(v).toLocaleString('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d })}`
  const tot = seg.rows.reduce((a, r) => a + r.profit, 0)
  const pos = seg.rows.reduce((a, r) => a + Math.max(r.profit, 0), 0) // 비중은 흑자 사업 합계 대비 (공통 비용이 크면 합계 대비로는 100%를 넘음)
  const totRev = seg.rows.reduce((a, r) => a + r.rev, 0)
  const th = 'py-1.5 px-1.5 text-right font-medium whitespace-nowrap'
  const td = 'py-1.5 px-1.5 text-right tabular-nums whitespace-nowrap'
  const maxP = Math.max(...seg.rows.map(r => Math.abs(r.profit)))
  const hasUnits = seg.rows.some(r => r.units)
  const fmtU = (v: number, unit: string) => {
    const n = v >= 100 ? Math.round(v).toLocaleString('ko-KR') : v >= 1 ? v.toFixed(1) : v >= 0.01 ? v.toFixed(3) : v.toPrecision(2)
    return `${n}${unit}`
  }
  // 아주 작은 수: 0이 아닌 숫자 2~3개가 보이도록 소수점 자리를 늘림
  const fmtTiny = (v: number, sig = 2) => v <= 0 ? '0' : v >= 1 ? v.toLocaleString('ko-KR', { maximumFractionDigits: 2 }) : v.toFixed(Math.min(14, Math.max(sig, Math.ceil(-Math.log10(v)) + sig - 1)))
  return (
    <div className="rounded bg-white/70 dark:bg-gray-900/60 p-3 space-y-2">
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
        사업부별 시계 — 어디서 얼마를 벌고, 내 몫은 얼마인가 <span className="font-normal text-gray-500">({seg.period}, 보유 {shares.toLocaleString()}주 기준)</span>
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="py-1.5 px-2 text-left font-medium">사업부</th>
              <th className={th}>매출 1초</th>
              <th className={th}><FTip text={<>{seg.profitLabel}. 사업부별로 나눈 방법은 표 아래 설명 참고.</>}>이익 1초</FTip></th>
              <th className={th}><FTip text="흑자를 내는 사업들의 이익 합계를 100%로 놓은 비중. 적자 사업·공통 비용은 그만큼을 깎아 먹는다는 뜻으로 마이너스로 표시.">이익 비중</FTip></th>
              <th className={th}>내 몫 오늘</th>
              <th className={th}>내 몫 1년</th>
              {hasUnits && <th className={th}><FTip text="사업부 판매량 × 내 주식 비율. 내가 그 사업의 주인이라면 1년 동안 내 몫으로 팔리는 양. ‘값’이 붙은 것은 매출을 대표 상품 가격으로 나눈 값이라 실제 개수와 다르다.">내 몫 판매 1초</FTip></th>}{hasUnits && <th className={th}>내 몫 판매 오늘</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {seg.rows.map((r, ri) => {
              return (
              <tr key={r.name}>
                <td className="py-1.5 px-2 whitespace-nowrap"><span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${r.color}`} /><FTip text={r.note}>{r.name}</FTip></td>
                <td className={td}>{r.rev ? usd(r.rev / secs) : '—'}</td>
                <td className={`${td} ${r.profit < 0 ? 'text-red-500' : ''}`}>{usd(r.profit / secs)}</td>
                <td className={td}>
                  <span className="inline-flex items-center gap-1 justify-end">
                    <span className={`inline-block h-1.5 rounded ${r.profit < 0 ? 'bg-red-400' : r.color}`} style={{ width: `${Math.round(40 * Math.abs(r.profit) / maxP)}px` }} />
                    {pos > 0 ? <>{r.profit < 0 ? '−' : ''}{Math.round(100 * Math.abs(r.profit) / pos)}%</> : '—'}
                  </span>
                </td>
                <td className={`${td} ${r.profit < 0 ? 'text-red-500' : ''}`}>{usd(r.profit / secs * today * mine, 5)}</td>
                <td className={`${td} ${r.profit < 0 ? 'text-red-500' : ''}`}>{usd(r.profit * (365.25 / seg.days) * mine, 3)}</td>
                {hasUnits && (() => {
                  if (!r.units) return <><td className={td}>—</td><td className={td}>—</td></>
                  const u = r.units
                  const perSec = u.n / secs * mine
                  const perYear = perSec * SEC_Y
                  const tipU = `${u.what} 기준${u.value ? ' (매출 ÷ 가격 = 몇 개 값)' : ''}. 회사 전체 1년 약 ${Math.round(u.n * 365.25 / seg.days).toLocaleString('ko-KR')}${u.unit}. 내 몫 1년 ${fmtU(perYear, u.unit)}${perYear < 1 && perYear > 0 ? ` (약 ${Math.round(1 / perYear).toLocaleString('ko-KR')}년에 1${u.unit})` : ''}.`
                  return <>
                    <td className={td}><FTip text={tipU}>{fmtTiny(perSec)}{u.unit}</FTip></td>
                    <td className={td}>{fmtTiny(perSec * today, 6)}{u.unit}</td>
                  </>
                })()}
              </tr>
              )
            })}
            <tr className="font-semibold">
              <td className="py-1.5 px-2">합계</td>
              <td className={td}>{totRev ? usd(totRev / secs) : '—'}</td>
              <td className={td}>{usd(tot / secs)}</td>
              <td className={td}>{pos > 0 ? `${Math.round(100 * tot / pos)}%` : '—'}</td>
              <td className={td}>{usd(tot / secs * today * mine, 5)}</td>
              <td className={td}>{usd(tot * (365.25 / seg.days) * mine, 3)}</td>
              {hasUnits && <><td className={td} /><td className={td} /></>}
            </tr>
          </tbody>
        </table>
      </div>
      {seg.products && (() => {
        const pr = seg.products
        const tr = pr.rows.reduce((a, r) => a + r.rev, 0)
        return (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 pt-1">{pr.title}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="py-1.5 px-2 text-left font-medium">제품</th>
                    <th className={th}>매출 1초</th>
                    <th className={th}>매출 비중</th>
                    <th className={th}>내 몫 매출 1년</th>
                    <th className={th}><FTip text="제품 판매량(매출 ÷ 대표 상품 가격) × 내 주식 비율.">내 몫 판매 1초</FTip></th>
                    <th className={th}>내 몫 판매 오늘</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {pr.rows.map(r => {
                    const u = r.units
                    const perSec = u ? u.n / secs * mine : 0
                    return (
                      <tr key={r.name}>
                        <td className="py-1.5 px-2 whitespace-nowrap"><span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${r.color}`} /><FTip text={r.note}>{r.name}</FTip></td>
                        <td className={td}>{usd(r.rev / secs)}</td>
                        <td className={td}>{Math.round(100 * r.rev / tr)}%</td>
                        <td className={td}>{usd(r.rev * (365.25 / seg.days) * mine, 2)}</td>
                        <td className={td}>{u ? <FTip text={`${u.what} 기준(매출 ÷ 가격 = 몇 개 값). 회사 전체 1년 약 ${Math.round(u.n * 365.25 / seg.days).toLocaleString('ko-KR')}${u.unit}. 내 몫 1년 ${fmtU(perSec * SEC_Y, u.unit)}${perSec * SEC_Y < 1 && perSec > 0 ? ` (약 ${Math.round(1 / (perSec * SEC_Y)).toLocaleString('ko-KR')}년에 1${u.unit})` : ''}.`}>{fmtTiny(perSec)}{u.unit}</FTip> : '—'}</td>
                        <td className={td}>{u ? `${fmtTiny(perSec * today, 6)}${u.unit}` : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: pr.note }} />
          </div>
        )
      })()}
      <div className="grid grid-cols-2 gap-2">
        {seg.facts.map(f => (
          <div key={f.label} className="rounded bg-gray-50 dark:bg-gray-800/60 px-3 py-2">
            <p className="text-[11px] text-gray-500 dark:text-gray-400"><FTip text={f.note}>{f.label}</FTip></p>
            <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">{f.value}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
        내 몫 = 회사 이익 × (내 주식 수 ÷ 전체 주식 {Math.round(sharesOut / 1e6).toLocaleString()}백만 주). 위 &lsquo;내 몫&rsquo; 칸의 보유 주식 수를 바꾸면 같이 바뀐다.
        {' '}{seg.src} 기준.{seg.days < 300 ? ' 이 기간 숫자를 1년으로 늘린 값이라 계절에 따라 달라진다.' : ''} <span dangerouslySetInnerHTML={{ __html: seg.how }} />
      </p>
    </div>
  )
}

function ValueClockCore({ cur, anchors: rawAnchors, monthly, last, g, sharesOut, divYield, storageKey, extraLive, liveTiles, segments, notes, peExclude, fcfPs, growthBar, fcfAnchors, ocfAnchors }: ClockProps) {
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

  const [smooth, setSmooth] = useState(false)
  const [basis, setBasis] = useState<'eps' | 'fcf' | 'ocf'>('eps')
  const hasF = !!fcfAnchors && fcfAnchors.length >= 3, hasO = !!ocfAnchors && ocfAnchors.length >= 3
  const isOcf = basis === 'ocf' && hasO
  const isFcf = (basis === 'fcf' && hasF) || isOcf   // 현금 기준(잉여현금·영업현금) 공통 문구용
  const baseAnchors = isOcf ? ocfAnchors! : basis === 'fcf' && hasF ? fcfAnchors! : rawAnchors
  const anchors = smooth ? smoothAnchors(baseAnchors) : baseAnchors
  const mL = isOcf ? 'P/OCF' : isFcf ? 'P/FCF' : 'PER'                       // 배수 이름
  const eL = isOcf ? '주당 영업현금' : isFcf ? '주당 잉여현금' : 'EPS'        // 기준 이름
  const profitAt = makeEpsAt(rawAnchors, g)           // '내 몫 이익'은 항상 회계 EPS
  const oneOff = oneOffFlag(baseAnchors)
  const epsAt = makeEpsAt(anchors, g)
  const peakAt = makePeakAt(anchors)
  const meaningful = (t: number, e: number | null): e is number => e != null && e > 0 && e >= MEANINGFUL_EPS_RATIO * peakAt(t)
  const tStart = Math.max(anchors[0]?.[0] ?? 0, monthly[0]?.t ?? 0, tNow - 35)
  const hist = monthly.filter(r => r.t >= tStart).map(r => {
    const e = epsAt(r.t)
    return { t: r.t, price: r.price, pe: meaningful(r.t, e) ? r.price / e : null }
  })
  const skippedYears = Math.round(hist.filter(r => r.t >= anchors[anchors.length - 1][0] - 20 && r.pe == null).length / 12)
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
  const line = (pe: number) => grid.map(t => { const e = epsAt(t); return { x: t, y: meaningful(t, e) ? e * pe : null } })
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
        { label: `싼 구간 경계 (${mL} ${peLo.toFixed(0)}배)`, data: line(peLo), borderColor: 'rgba(16,185,129,0.5)', borderWidth: 1, pointRadius: 0, fill: false, spanGaps: false },
        { label: `비싼 구간 경계 (${mL} ${peHi.toFixed(0)}배)`, data: line(peHi), borderColor: 'rgba(239,68,68,0.5)', borderWidth: 1, pointRadius: 0, fill: '-1', backgroundColor: 'rgba(156,163,175,0.12)', spanGaps: false },
      ] : []),
      { label: `적정가 선 (${eL} × ${fairPe}배)`, data: line(fairPe), borderColor: 'rgba(37,99,235,0.95)', borderWidth: 2, pointRadius: 0, fill: false, spanGaps: false,
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

  const toggles = (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-600 dark:text-gray-300">
      {(hasF || hasO) && (
        <span className="inline-flex items-center gap-1">
          기준
          {([['eps', '이익(EPS)'], ...(hasF ? [['fcf', '잉여현금흐름']] : []), ...(hasO ? [['ocf', '영업현금흐름']] : [])] as Array<['eps' | 'fcf' | 'ocf', string]>).map(([k, l]) => (
            <button key={k} type="button" onClick={() => { setBasis(k); setPePick(null) }}
              className={`px-2 py-0.5 rounded border ${basis === k ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'}`}>{l}</button>
          ))}
        </span>
      )}
      <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" checked={smooth} onChange={e => { setSmooth(e.target.checked); setPePick(null) }} className="accent-blue-600" />
        3년 평균으로 보기
      </label>
    </div>
  )
  if (!epsNow || epsNow <= 0) {
    return (
      <div className="space-y-2">
        {toggles}
        <p className={p}>최근 1년 {eL}{isFcf ? '이' : '가'} {isFcf ? '마이너스(설비투자가 영업현금보다 큼)' : '적자'}라 적정가 선을 그릴 수 없다.{isFcf ? ' 이익(EPS) 기준으로 돌아가 본다.' : ''}</p>
        {(liveTiles || segments) && <SalesLive liveTiles={liveTiles} seg={segments} sharesOut={sharesOut} />}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {toggles}
      {isOcf && (
        <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
          <b>영업현금흐름 기준</b> = 사업으로 실제 들어온 현금(설비투자를 빼기 전). 장부상 일회성 비용에도, 설비투자 급증(아마존·마이크로소프트 등)에도 덜 흔들린다.
          대신 설비투자가 원래 큰 업종(통신·전력·반도체 공장 등)은 실제로 꺼낼 수 있는 돈보다 크게 잡힌다. 적정 배수는 지난 20년 월말 주가 ÷ 그때의 주당 영업현금흐름(P/OCF)의 중간값.
        </p>
      )}
      {isFcf && !isOcf && (
        <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
          <b>잉여현금흐름 기준</b> = 영업으로 들어온 현금 − 설비투자. 버핏이 말하는 &lsquo;회사에서 꺼낼 수 있는 현금&rsquo;에 가깝고, 자산 감액·인수 비용 같은 장부상 일회성 비용에 덜 흔들린다.
          대신 설비투자를 크게 늘리는 해(아마존 등)에는 작게 나오고, 은행·보험에는 맞지 않는다. 적정 배수는 지난 20년 월말 주가 ÷ 그때의 주당 잉여현금흐름(P/FCF)의 중간값.
        </p>
      )}
      {oneOff && (
        <div className="rounded border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-900/10 p-2.5 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
          <b>주의: 최근 1년 {eL}{isFcf ? '이' : '가'} 직전 3년 최고치의 {Math.round(oneOff.ratio * 100)}%{oneOff.kind === 'drop' ? '로 크게 줄었다' : '로 크게 늘었다'}.</b>{' '}
          {oneOff.kind === 'drop'
            ? '구조조정·자산 감액·인수 비용 같은 일회성 비용이 섞였을 가능성이 크다. 그러면 적정가가 실제보다 낮게 잡혀 "비쌈"이 과장된다.'
            : '사업 매각·지분 평가 같은 일회성 이익이나 경기 호황이 섞였을 수 있다. 그러면 적정가가 높게 잡혀 "쌈"이 과장된다.'}
          {' '}&lsquo;적정가 대비&rsquo;는 참고만 하고, {hasF || hasO ? '다른 기준 버튼이나 ' : ''}&lsquo;3년 평균으로 보기&rsquo;와 비교해 본다.
        </div>
      )}
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
        <div className={tile}><p className={lab}>지금 {mL}{zone ? ' · 구간' : ''}</p><p className={`${big} ${zone?.c ?? ''}`}>{peNow ? `${peNow.toFixed(1)}배` : '—'}{zone ? ` · ${zone.t}` : ''}</p></div>
        <div className={tile}><p className={lab}>적정가 대비</p><p className={`${big} ${gap != null && gap < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>{gap != null ? `${gap > 0 ? '+' : ''}${gap.toFixed(1)}% ${gap < 0 ? '(쌈)' : '(비쌈)'}` : '—'}</p></div>
      </div>

      {Math.round(peExMid ?? peMid ?? 20) >= HIGH_PE_WARN && (
        <div className="rounded border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-900/10 p-2.5 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
          <b>주의: 과거 PER 중간값이 {Math.round(peExMid ?? peMid ?? 20)}배로 매우 높다.</b> 번 돈을 재투자하느라 회계 이익을 작게 남겨 온 기업(아마존 등)이나
          감가상각 때문에 이익이 작게 잡히는 업종(리츠 등)은 &lsquo;이익 × 과거 PER&rsquo; 방식의 적정가가 크게 부풀려질 수 있다. 위 &lsquo;적정가 대비&rsquo;는 참고만 하고,
          아래 적정 PER 바에서 5년·10년 평균이나 지금 PER로 바꿔 보며 판단한다.
        </div>
      )}

      <p className={p}>
        <b>파란 선 = 적정가 = 최근 1년 {eL} × 적정 {mL}.</b> 이익이 늘면 파란 선이 오른쪽 위로 올라가고, 정한 EPS 성장률(연 {g.toFixed(1)}%)로 10년 뒤까지 이어진다(점선).
        검은 선(주가)이 띠 아래면 싼 구간, 위면 비싼 구간이다.
        {skippedYears > 0 && <> {eL}{isFcf ? '이' : '가'} 적자이거나 그때까지 최고치의 20%도 안 되던 구간(지난 20년 중 약 {skippedYears}년)은 {mL}이 의미가 없어 선을 끊고 {mL} 계산에서도 뺐다.</>}
        {peMid != null && <> 적정 {mL} 기본값은 {peExMid != null && peExclude ? <>{peExclude.label}({peExMid.toFixed(0)}배, 전체 {yrsUsed}년 중간값은 {peMid.toFixed(0)}배)</> : <>지난 {yrsUsed}년 {mL}의 중간값({peMid.toFixed(0)}배)</>}, 띠는 하위·상위 25%({peLo!.toFixed(0)}~{peHi!.toFixed(0)}배)다.</>}
      </p>

      <div className="rounded border border-gray-200 dark:border-gray-800 p-3 space-y-4">
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">조절 — 파란 선을 움직이는 두 가지</p>
      {growthBar}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="font-medium text-gray-700 dark:text-gray-200">적정 {mL}</span>
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
          {peExMid != null ? `기본값은 ${peExclude!.label}.` : peMid != null ? `기본값은 과거 ${mL} 중간값.` : `과거 ${mL} 자료가 짧아 기본값 20배.`} 아래 버튼을 누르면 그 값으로 바뀐다.
          지금 {mL}({peNow?.toFixed(0)}배)로 두면 &lsquo;주가가 {isFcf ? '현금흐름' : '이익'}만큼만 오를 때&rsquo;가 된다. {mL}은 월말 주가 ÷ 그때의 최근 1년 {eL}(적자·200배 이상 제외).
        </p>
      </div>
      </div>

      <div className="rounded bg-blue-50/60 dark:bg-blue-950/20 p-3 space-y-2">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">째깍째깍 — 버핏처럼 초 단위로 보기</p>
        <ClockLive cur={cur} epsAt={epsAt} profitAt={profitAt} fairPe={fairPe} shares={shares} sharesOut={sharesOut} extraLive={extraLive} liveTiles={liveTiles} segments={segments}
          fcfPs={fcfPs} dps={divYield > 0 ? price * divYield / 100 : null}
          sharesInput={
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              보유 주식 수
              <input type="text" inputMode="decimal" placeholder="1" value={sharesTxt} onChange={e => saveShares(e.target.value)}
                className="w-20 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-0.5 tabular-nums" />
              <span className="text-gray-400">주 (비우면 1주 · 이 기기에만 저장)</span>
            </label>
          } />
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
  const peakAt = makePeakAt(anchors)
  // 출발점 이익이 0 근처(그때까지 최고의 20% 미만)면 성장률이 터무니없이 커지므로 뺀다
  const cagr = (a: ClockAnchor, b: ClockAnchor) =>
    a[1] > 0 && b[1] > 0 && b[0] - a[0] > 1 && a[1] >= MEANINGFUL_EPS_RATIO * peakAt(a[0]) ? (Math.pow(b[1] / a[1], 1 / (b[0] - a[0])) - 1) * 100 : null
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

// 에르메스 주당 잉여현금흐름 기준점 (연말, 조정 잉여현금흐름 ÷ 유통 주식 수) — 이익 시계 '잉여현금흐름 기준'·표 '현금' 열
const RMS_FCF_ANCHORS: ClockAnchor[] = Object.entries(RMS_FIN).filter(([, r]) => r.fcf != null)
  .map(([y, r]) => [Number(y) + 1, r.fcf! * 1e6 / RMS_SHARES] as ClockAnchor)

const RMS_OCF_ANCHORS: ClockAnchor[] = Object.entries(RMS_FIN).filter(([, r]) => r.ocf != null)
  .map(([y, r]) => [Number(y) + 1, r.ocf! * 1e6 / RMS_SHARES] as ClockAnchor)

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
const LEATHER_Q3_2026 = 1912e6 // 가죽·마구 부문 매출 2026년 3분기 (2026-10-22 회사 발표, 전체 40.96억 유로 중)
const BIRKIN30_EUR = 10600  // 버킨 30(토고 가죽) 유럽 정가, 2026년 1월 인상 후 (PurseBop·Sotheby's 정리, 회사 공식 가격표 아님)

type MonthlyPrice = { last: { date: string; close: number }; rows: Array<{ d: string; c: number }> }

// 에르메스 가방 시계: 최근 분기 가죽·마구 매출을 버킨 정가로 나눠 '버킨 몇 개 값'으로 바꿔 부른다 (실제 버킨 판매 개수 아님)
function rmsBagTiles(now: number): LiveTile[] {
  const perDay = LEATHER_Q3_2026 / 92 // 2026년 3분기(7~9월, 92일)
  const startOfDay = new Date(new Date(now).setHours(0, 0, 0, 0)).getTime()
  const today = perDay * (now - startOfDay) / 86400000
  const eur = (v: number) => `€${Math.round(v).toLocaleString('ko-KR')}`
  const src = <>버킨·켈리가 속한 가죽 제품 매출(가장 최근 발표인 2026년 3분기 7~9월 {(LEATHER_Q3_2026 / 1e8).toFixed(2)}억 유로, 전체 매출의 47%, 1년 전보다 +10.8%)을 하루·초로 나눈 값.</>
  return [
    { label: '가죽 제품 매출: 1초', value: eur(perDay / 86400), tip: src },
    { label: '가죽 제품 매출: 오늘 0시부터', value: eur(today), tip: <>{src} 하루 약 €{(perDay / 1e6).toFixed(1)}백만.</> },
    { rate: { perSec: perDay / BIRKIN30_EUR / 86400, what: '버킨', unit: '개' }, label: '버킨 몇 개 값: 1초', value: `약 ${Math.round(86400 * BIRKIN30_EUR / perDay)}초에 1개`, tip: <>가죽 제품 매출을 버킨 30 유럽 정가(€{BIRKIN30_EUR.toLocaleString()})로 나눈 값. 하루 약 {Math.round(perDay / BIRKIN30_EUR / 10) * 10}개 값. 실제로 버킨만 이만큼 팔린다는 뜻이 아니다(단위일 뿐).</> },
    { label: '버킨 몇 개 값: 오늘 0시부터', value: `${Math.floor(today / BIRKIN30_EUR).toLocaleString()}개`, tip: <>
      오늘 판 가죽 제품 매출을 버킨 30 유럽 정가(€{BIRKIN30_EUR.toLocaleString()}, 2026년 1월 인상 후)로 나눈 값. 하루 약 {Math.round(perDay / BIRKIN30_EUR / 10) * 10}개 값, 약 {Math.round(86400 * BIRKIN30_EUR / perDay)}초마다 1개 값.
      <br /><b>주의:</b> 버킨이 실제로 이만큼 팔린다는 뜻이 아니다. 버킨은 매출 크기를 감으로 느끼기 위한 &lsquo;단위&rsquo;일 뿐이다. 이 매출에는 다른 가방, 지갑 같은 작은 가죽 소품, 여행 가방, 승마용품이 모두 섞여 있고, 에르메스는 버킨만의 매출이나 판매 개수를 공개하지 않는다.</> },
  ]
}

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
          sharesOut={RMS_SHARES} divYield={1.35} storageKey="rms-shares" extraLive={extraLive} liveTiles={rmsBagTiles} segments={SEGMENTS.RMS}
          fcfAnchors={RMS_FCF_ANCHORS} ocfAnchors={RMS_OCF_ANCHORS}
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
  revQ?: { start: string; end: string; rev: number; prev?: number } // 가장 최근 한 분기 매출(백만 달러) — 판매 시계용
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

// 주당 영업현금흐름 기준점 (scripts/export_fair_value.py ocf_anchors와 같음): 연간 = EPS × 영업현금 ÷ 순이익, 최근 1년 = 영업현금 ÷ 유통 주식 수
function ocfAnchorsOf(f: ClockFund): ClockAnchor[] | undefined {
  const ys = f.cash?.years
  if (!ys) return undefined
  const a: ClockAnchor[] = []
  for (const [y, r] of Object.entries(ys)) {
    const e = (f.eps as any)?.[y], o = r.ocf, n = r.ni
    if (e != null && o != null && n && Math.abs(e) >= 0.1 && (e > 0) === (n > 0) && r.end) a.push([decYear(Date.parse(r.end)), e * o / n])
  }
  a.sort((x, y) => x[0] - y[0])
  const t = f.cash?.ttm as any, sh = f.shares?.count
  if (t?.asOf && t.ocf != null && sh && a.length && decYear(Date.parse(t.asOf)) > a[a.length - 1][0] + 0.1) a.push([decYear(Date.parse(t.asOf)), t.ocf * 1e6 / sh])
  return a.length >= 3 ? a : undefined
}

// 주당 잉여현금흐름 기준점: 연간(cash.years.fcfPs, 결산일) + 최근 1년(metrics.fcfPs, cash.ttm.asOf)
function fcfAnchorsOf(f: ClockFund): ClockAnchor[] | undefined {
  const ys = f.cash?.years
  if (!ys) return undefined
  const a: ClockAnchor[] = Object.values(ys).filter(y => (y as any).fcfPs != null && y.end)
    .map(y => [decYear(Date.parse(y.end)), (y as any).fcfPs as number] as ClockAnchor).sort((x, y) => x[0] - y[0])
  const t = f.cash?.ttm as any
  const ttmPs = (f.metrics as any)?.fcfPs
  if (t?.asOf && ttmPs != null && a.length && decYear(Date.parse(t.asOf)) > a[a.length - 1][0] + 0.1) a.push([decYear(Date.parse(t.asOf)), ttmPs])
  return a.length >= 3 ? a : undefined
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
  const peakA = makePeakAt(anchors)
  const firstA = anchors.find(a => a[1] > 0 && a[0] >= 1995 && a[1] >= MEANINGFUL_EPS_RATIO * peakA(a[0]))
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
        liveTiles={stockKey === 'NKE' ? nkeShoeTiles : (() => {
          const man = SALES_CLOCK[stockKey], auto = revQClock(f.cash?.revQ, f.cash?.ttm?.ni ?? (f.cash?.years ? Object.entries(f.cash.years).sort((a, b) => +b[0] - +a[0])[0]?.[1]?.ni : null))
          // 직접 조사한 숫자 + 매출. 매출을 직접 적지 않았으면 SEC 자동 매출을 쓰고, 대표 상품 값(equiv)도 그 매출로 계산
          const list = (man?.rev ? [man] : man && auto && man.equiv
            ? [{ ...auto, equiv: man.equiv }, { ...man, equiv: undefined }]
            : [man, auto]).filter((x): x is SalesClock => !!x && !!(x.rev || x.count || x.level))
          const all = list.flatMap(sc => [sc, ...(sc.more ?? [])])
          return all.length ? (now: number) => all.flatMap(sc => salesClockTiles(sc, now)) : undefined
        })()}
        fcfAnchors={fcfAnchorsOf(f)} ocfAnchors={ocfAnchorsOf(f)}
        fcfPs={m.fcfPs ?? null}
        segments={SEGMENTS[stockKey] ?? (SEG_MIX[stockKey] ? segFromMix(SEG_MIX[stockKey], f) : undefined)}
        notes={`EPS는 SEC 공시(10-K) 회계연도 값을 마감일 기준으로 이은 근사치이고(2008년 무렵 이전은 10-K 원문의 5년 요약 표에서 읽고 겹치는 해로 맞춘 값), ${f.ttmAsOf ?? '최근'} 이후는 정한 성장률로 연장했다. 주가는 배당을 반영하지 않은 월말 종가(분할 반영). 일회성 손익이 큰 해는 선이 출렁인다. 회사 전체 숫자는 공시 유통 주식 수${f.shares ? `(${f.shares.asOf})` : ''} × 최근 1년 EPS로 계산한 근사치.`}
      />
    </div>
    {f.cash && <CashReturnPanel cash={f.cash} m={m} />}
    </>
  )
}

// 나이키 신발 시계: 최근 분기 나이키 브랜드 신발 매출을 에어포스 1 정가로 나눠 '몇 켤레 값'으로 바꿔 부른다 (실제 판매 켤레 수 아님)
const NKE_FW_Q = 6.95e9    // 나이키 브랜드 신발 매출, 2027 회계연도 1분기(2026년 6~8월, 92일) — 2026-10-01 회사 발표
const NKE_FW_Q_DAYS = 92
const AF1_USD = 115        // 에어포스 1 '07 기본 모델 미국 정가 (판매처 표기 기준, 색상별로 115~125달러)
function nkeShoeTiles(now: number): LiveTile[] {
  const perDay = NKE_FW_Q / NKE_FW_Q_DAYS
  const startOfDay = new Date(new Date(now).setHours(0, 0, 0, 0)).getTime()
  const today = perDay * (now - startOfDay) / 86400000
  const usd = (v: number) => `$${Math.round(v).toLocaleString('ko-KR')}`
  const src = <>나이키 브랜드 신발 매출(가장 최근 발표인 2027 회계연도 1분기 = 2026년 6~8월 {(NKE_FW_Q / 1e8).toFixed(1)}억 달러, 1년 전보다 −6%)을 하루·초로 나눈 값. 조던 포함, 컨버스 제외.</>
  return [
    { label: '신발 매출: 1초', value: usd(perDay / 86400), tip: src },
    { label: '신발 매출: 오늘 0시부터', value: usd(today), tip: <>{src} 하루 약 ${(perDay / 1e6).toFixed(1)}백만.</> },
    { rate: { perSec: perDay / AF1_USD / 86400, what: '에어포스 1', unit: '켤레' }, label: '에어포스 1 몇 켤레 값: 1초', value: `${(perDay / AF1_USD / 86400).toFixed(1)}켤레`, tip: <>신발 매출을 에어포스 1 &lsquo;07 미국 정가(${AF1_USD})로 나눈 값. 하루 약 {(Math.round(perDay / AF1_USD / 1000) / 10).toFixed(1)}만 켤레 값. 실제로 에어포스 1만 이만큼 팔린다는 뜻이 아니다(단위일 뿐).</> },
    { label: '에어포스 1 몇 켤레 값: 오늘 0시부터', value: `${Math.floor(today / AF1_USD).toLocaleString()}켤레`, tip: <>
      오늘 판 신발 매출을 에어포스 1 &lsquo;07 미국 정가(${AF1_USD})로 나눈 값. 하루 약 {(Math.round(perDay / AF1_USD / 1000) / 10).toFixed(1)}만 켤레 값, 1초에 약 {(perDay / AF1_USD / 86400).toFixed(1)}켤레 값.
      <br /><b>주의:</b> 에어포스 1이 실제로 이만큼 팔린다는 뜻이 아니다. 매출 크기를 감으로 느끼기 위한 &lsquo;단위&rsquo;일 뿐이다. 나이키는 판매 켤레 수를 공개하지 않는다. 매출의 상당 부분은 매장에 넘기는 도매가(소비자 가격보다 싸다)라서 실제 켤레 수는 이보다 많을 가능성이 크다.</> },
  ]
}

// ── 판매 시계: 회사가 발표한 최근 분기(또는 연간) 숫자를 초·오늘 단위로 나눠 째깍째깍 칸에 보여 준다 ──
// count = 회사가 공개한 실제 횟수(결제 건수·수술 건수 등). equiv = 매출을 대표 상품 가격으로 나눈 '몇 개 값'(실제 판매 개수 아님).
type SalesClock = {
  cur: '$' | '€'
  period: string                  // 예: '2026년 4~6월'
  days: number                    // 그 기간의 날짜 수
  src: string                     // 발표 시점·출처
  how?: string                    // 계산 설명을 바꿀 때 (예: 하루 평균으로 발표된 숫자)
  level?: { value: string; label: string; note: string } // 흐름이 아닌 규모 숫자 (예: 하루 이용자 수)
  rev?: { amount: number; label: string; note: string }
  count?: { n: number; label: string; unit: string; note: string; approx?: boolean; perDay?: number } // perDay: 회사가 하루 평균으로 발표한 경우
  equiv?: { price: number; item: string; unit: string; priceNote: string; caveat: string }
  equivOnly?: boolean             // 매출 타일은 빼고 대표 상품 값 타일만 (브랜드별로 나눌 때)
  more?: SalesClock[]             // 브랜드가 여럿인 회사: 브랜드별 시계 (예: 얌 = KFC·타코벨·피자헛)
}
const SALES_CLOCK: Record<string, SalesClock> = {
  V: {
    cur: '$', period: '2026 회계연도 3분기(2026년 4~6월)', days: 91, src: '2026-07-28 회사 실적 발표',
    count: { n: 71.7e9, label: '비자 결제 처리', unit: '건', note: '비자 망에서 처리된 결제·현금 인출 건수 717억 건(1년 전보다 +10%). 비자 카드라도 다른 망으로 처리된 건은 빠진다.' },
  },
  MA: {
    cur: '$', period: '2026년 2분기(4~6월)', days: 91, src: '2026년 7월 회사 실적 발표',
    count: { n: 47.4e9, label: '마스터카드 결제 처리', unit: '건', note: '마스터카드 망에서 처리된 결제 건수 474억 건(1년 전보다 +9%).' },
  },
  ISRG: {
    cur: '$', period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-20 회사 실적 발표',
    count: { n: 906_000, label: '다빈치 로봇 수술', unit: '건', note: '전 세계 다빈치 로봇 수술 약 90.6만 건(1년 전보다 +14%). 폐 조직 검사 로봇(Ion) 약 5만 건은 뺐다.' },
    rev: { amount: 3.05e9, label: '매출', note: '회사 전체 매출 30.5억 달러(1년 전보다 +22%). 매출의 대부분은 수술마다 쓰는 기구·소모품과 정비 계약에서 나온다.' },
  },
  AAPL: {
    cur: '$', period: '2026 회계연도 3분기(2026년 4~6월)', days: 91, src: '2026-07-30 회사 실적 발표',
    rev: { amount: 54.25e9, label: '아이폰 매출', note: '아이폰 매출 542.5억 달러(1년 전보다 +22%). 회사 전체 매출은 1,094억 달러.' },
    equiv: { price: 799, item: '아이폰 17', unit: '대', priceNote: '아이폰 17 기본 모델 미국 출시가($799)',
      caveat: '프로·프로맥스처럼 비싼 모델이 많이 팔려 평균 판매가는 이보다 높으므로, 실제 판매 대수는 이 숫자보다 적다. 애플은 판매 대수를 공개하지 않는다.' },
  },
  MCD: {
    cur: '$', period: '2026년 2분기(4~6월)', days: 91, src: '2026년 7월 회사 실적 발표',
    rev: { amount: 37e9, label: '전 세계 매장 매출', note: '가맹점을 포함한 전 세계 맥도날드 매장 매출 약 370억 달러(1년 전보다 +5%). 맥도날드 회사의 매출은 이 중 가맹점이 내는 임대료·로열티 등이라 훨씬 작다.' },
    equiv: { price: 6.12, item: '빅맥', unit: '개', priceNote: '미국 빅맥 가격($6.12, 2026년 1월 빅맥 지수)',
      caveat: '빅맥만 파는 게 아니라 감자튀김·음료·아침 메뉴 등이 모두 섞여 있고, 나라마다 가격도 다르다. 빅맥은 매출 크기를 감으로 느끼기 위한 단위일 뿐이다.' },
  },
  CPRT: {
    cur: '$', period: '2026 회계연도(2025년 8월~2026년 7월)', days: 365, src: '회사 발표(연간 실적·회사 소개 문구)',
    count: { n: 4e6, label: '경매로 판 차량', unit: '대', approx: true, note: '회사 소개 문구 기준 ‘지난 1년 400만 대 이상’ 판매(사고·침수 차량 등 보험사 물량이 79%). 정확한 대수는 공개 숫자가 ‘이상’이라 근사치다.' },
    rev: { amount: 4.7e9, label: '매출', note: '연간 매출 약 47억 달러.' },
  },
  ROL: {
    cur: '$', period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-21 회사 실적 발표',
    rev: { amount: 1.09e9, label: '방역 서비스 매출', note: '오킨 등 해충 방제 서비스 매출 약 10.9억 달러(1년 전보다 +6.2%). 회사가 서비스 건수를 공개하지 않아 매출만 보여 준다.' },
  },
  LII: {
    cur: '$', period: '2026년 2분기(4~6월)', days: 91, src: '2026년 7월 회사 실적 발표 (3분기는 10월 28일 발표 예정)',
    rev: { amount: 1.5e9, label: '냉난방 장비 매출', note: '에어컨·히트펌프·보일러 등 매출 약 15억 달러(1년 전보다 +3%, 인수 효과 포함). 여름이 성수기라 분기마다 차이가 크다. 회사가 판매 대수를 공개하지 않아 매출만 보여 준다.' },
  },
  IDXX: {
    cur: '$', period: '2026년 2분기(4~6월)', days: 91, src: '2026-08-04 회사 실적 발표',
    rev: { amount: 1.217e9, label: '동물 진단 매출', note: '동물병원 진단 장비·검사 키트·검사 대행 등 매출 12.17억 달러(1년 전보다 +10%). 회사가 검사 건수를 공개하지 않아 매출만 보여 준다.' },
  },
  PM: {
    cur: '$', period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-21 회사 실적 발표',
    count: { n: 206.2e9, label: '담배 출하', unit: '개비', note: '말보로 등 일반 담배 1,580억 개비 + 가열 담배(아이코스) 415억 개 + 기타를 합친 2,062억 개(1년 전보다 +0.6%). 일반 담배는 제자리, 늘어난 건 연기 없는 제품.' },
  },
  WMT: {
    cur: '$', period: '2026 회계연도', days: 7, src: '회사 실적 발표 문구', how: '를 하루 24시간에 고르게 나눈 값. 실제로는 낮 시간·주말에 몰린다.',
    count: { n: 280e6, label: '매장·온라인 방문 손님', unit: '명', note: '19개 나라 1만 900여 개 매장과 웹사이트에 1주일에 약 2억 8천만 명이 온다(회사 발표). 같은 사람이 여러 번 오면 여러 번 센다.' },
  },
  COST: {
    cur: '$', period: '2026 회계연도 4분기 말(2026년 8월)', days: 1, src: '2026년 10월 회사 실적 발표',
    equiv: { price: 1.5, item: '핫도그 세트', unit: '개', priceNote: '1985년부터 값을 안 올린 핫도그+음료 세트($1.50)',
      caveat: '실제로는 식료품·가전·기름 등이 팔린다. 40년 동안 같은 값인 핫도그 세트로 매출 크기를 감으로 느끼기 위한 단위일 뿐이다.' },
    level: { value: '8,410만 명', label: '연회비 내는 회원', note: '연회비를 낸 회원 8,410만 명(1년 전보다 +3.8%), 가족 카드 포함 1억 5,040만 명. 미국·캐나다 갱신율 92.3%. 코스트코 이익의 큰 몫이 이 연회비에서 나온다.' },
  },
  GOOGL: {
    cur: '$', period: '2024년 기준', days: 365, src: '2025년 1월 회사 공식 발표',
    count: { n: 5e12, label: '구글 검색', unit: '회', note: '구글이 밝힌 ‘1년 5조 회 이상’(2016년 2조 회 이후 첫 공식 숫자). 그 뒤로 더 늘었을 가능성이 크다(외부 추정 연 6조 회 안팎).' },
  },
  GE: {
    cur: '$', period: '회사 소개 자료(2024년)', days: 1, src: 'GE 에어로스페이스 발표', how: '를 하루 24시간에 고르게 나눈 값.',
    count: { n: 0, perDay: 43_200, label: 'GE 엔진 비행기 이륙', unit: '번', note: '‘GE 엔진 기술이 들어간 비행기가 2초마다 1대씩 이륙한다’(회사 발표). 사프란과 합작한 CFM 엔진 등 합작 엔진 포함. 전 세계 비행기 이륙의 약 4분의 3. 회사 마케팅 숫자라 독립 검증은 안 됐다.' },
  },
  AXP: {
    cur: '$', period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-23 회사 실적 발표',
    rev: { amount: 454e9, label: '카드 결제액', note: '아멕스 카드로 결제된 금액 4,540억 달러(1년 전보다 +8%). 회사 매출이 아니라 회원들이 쓴 돈이다. 회사는 이 중 가맹점 수수료(약 2~3%)와 연회비·이자로 돈을 번다(같은 분기 매출 201억 달러).' },
  },
  CMG: {
    cur: '$', period: '2026년 2분기(4~6월)', days: 91, src: 'SEC 분기 보고서',
    rev: { amount: 3.3486e9, label: '매출', note: '치폴레 매출 33.5억 달러(1년 전보다 +9.3%, 대부분 새 매장 효과).' },
    equiv: { price: 10.5, item: '치킨 보울', unit: '그릇', priceNote: '치킨 부리토 보울 가격(미국 도시마다 약 $9~12라 가운데 $10.50으로 잡음)',
      caveat: '음료·칩·과카몰리 추가 등이 섞여 있고 지역마다 값이 다르다. 치킨 보울은 매출 크기를 감으로 느끼기 위한 단위일 뿐이다.' },
  },
  TSLA: {
    cur: '$', period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-02 회사 인도 실적 발표',
    count: { n: 486_532, label: '테슬라 차 인도', unit: '대', note: '전 세계에 인도한 차 48만 6,532대(1년 전보다 −2.1%, 분석가 예상 46만 2천 대보다 많음). 모델 3·Y가 47만 8,237대.' },
  },
  GM: {
    cur: '$', period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-01 회사 미국 판매 발표',
    count: { n: 670_974, label: 'GM 차 판매(미국)', unit: '대', note: '미국에서 판 차 67만 974대(1년 전보다 −5.5%). 미국 밖 판매는 빠졌다. 전기차는 2만 5,473대로 크게 줄었다.' },
  },
  F: {
    cur: '$', period: '2026년 3분기(7~9월)', days: 92, src: '2026년 10월 회사 미국 판매 발표',
    count: { n: 509_764, label: '포드 차 판매(미국)', unit: '대', note: '미국에서 판 차 50만 9,764대(1년 전보다 −6.6%, 단종 차종을 빼면 거의 제자리). 미국 밖 판매는 빠졌다.' },
  },
  PYPL: {
    cur: '$', period: '2026년 2분기(4~6월)', days: 91, src: '2026년 7월 회사 실적 발표',
    count: { n: 6.8e9, label: '페이팔·벤모 결제', unit: '건', note: '페이팔·벤모·브레인트리로 처리된 결제 68억 건(1년 전보다 +8%), 결제 금액 4,864억 달러. 활성 계정 4억 3,900만 개.' },
  },
  EXPE: {
    cur: '$', period: '2026년 2분기(4~6월)', days: 91, src: '2026-08-05 회사 실적 발표',
    count: { n: 111.5e6, label: '숙박 예약', unit: '박', note: '익스피디아·호텔스닷컴·브르보 등에서 예약된 숙박 1억 1,150만 박(1년 전보다 +6%).' },
  },
  LYV: {
    cur: '$', period: '2026년 2분기(4~6월)', days: 91, src: '2026-07-30 회사 실적 발표',
    count: { n: 49e6, label: '공연장 입장 관객', unit: '명', note: '라이브네이션 공연에 온 관객 약 4,900만 명(1년 전보다 +10%). 티켓마스터가 판 수수료 붙는 티켓은 같은 분기 9,000만 장.' },
  },
  RCL: {
    cur: '$', period: '2026년 2분기(4~6월)', days: 91, src: '2026년 7월 회사 실적 발표',
    count: { n: 2.4e6, label: '크루즈 승선 손님', unit: '명', note: '로열캐리비안·셀러브리티 등 크루즈에 탄 손님 약 240만 명(1년 전보다 +6%). 객실당 2명으로 센 정원보다 10% 더 탔다(3~4인 가족이 한 방을 쓰는 경우가 많아서, 탑승률 110%).' },
  },
  UAL: {
    cur: '$', period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-20 회사 실적 발표',
    count: { n: 49.5e6, label: '유나이티드 탑승객', unit: '명', note: '탑승객 4,950만 명(3분기 사상 최대). 7월 한 달에만 1,840만 명으로 역대 가장 바쁜 달.' },
  },
  MO: {
    cur: '$', period: '2026년 2분기(4~6월)', days: 91, src: '2026년 7월 회사 분기 보고서',
    count: { n: 16.06e9, label: '담배 출하(미국)', unit: '개비', note: '말보로 등 미국 담배 출하 약 160억 개비(1년 전 165억 개비, 재고 조정 후 약 −4%). 미국 흡연 인구가 줄면서 해마다 줄고, 회사는 가격 인상으로 매출을 지킨다.' },
  },
  SBUX: {
    cur: '$', period: '2026 회계연도 3분기(2026년 4~6월)', days: 91, src: 'SEC 분기 보고서',
    rev: { amount: 9.3227e9, label: '매출', note: '스타벅스 매출 93.2억 달러(1년 전보다 −1.4%). 매장 판매가 대부분이고, 마트용 원두·캔커피 등 라이선스 매출이 조금 섞여 있다.' },
    equiv: { price: 5.45, item: '그란데 라테', unit: '잔', priceNote: '미국 그란데 카페라테 가격(약 $5.45, 2026년 5월 메뉴 조사)',
      caveat: '음료 말고 샌드위치·베이커리·원두도 팔고, 나라·도시마다 값이 다르다. 스타벅스는 판매 잔 수를 공개하지 않는다. 라테는 매출 크기를 감으로 느끼기 위한 단위일 뿐이다.' },
  },
  DLTR: {
    cur: '$', period: '', days: 1, src: '',
    equiv: { price: 1.25, item: '1.25달러 물건', unit: '개', priceNote: '달러트리 기본 가격($1.25)',
      caveat: '요즘은 $3~7짜리 물건도 팔아 매출의 일부를 차지하므로 실제 개수는 이보다 적다. 회사는 판매 개수를 공개하지 않는다.' },
  },
  LULU: {
    cur: '$', period: '', days: 1, src: '',
    equiv: { price: 108, item: '얼라인 레깅스', unit: '벌', priceNote: '대표 상품 얼라인 레깅스 25인치 가격(약 $108, 판매처 표기)',
      caveat: '레깅스 말고 상의·가방 등도 섞여 있고 할인 판매도 있다. 단위일 뿐이다.' },
  },
  DECK: {
    cur: '$', period: '', days: 1, src: '',
    equiv: { price: 155, item: '호카 클리프턴', unit: '켤레', priceNote: '호카 대표 러닝화 클리프턴 10 출시 정가($155)',
      caveat: '호카 말고 어그(UGG) 부츠 등도 섞여 있고, 매출의 상당 부분이 매장에 넘기는 도매가라 실제 켤레 수는 이보다 많을 수 있다. 단위일 뿐이다.' },
  },
  MNST: {
    cur: '$', period: '', days: 1, src: '',
    equiv: { price: 2.68, item: '몬스터 캔', unit: '캔', priceNote: '몬스터 에너지 16온스 캔 미국 소매가(약 $2.68, 월마트 표기)',
      caveat: '몬스터의 매출은 병입·유통 회사에 넘기는 값이라 소비자 가격보다 훨씬 싸다. 그래서 실제 팔린 캔 수는 이 숫자보다 많다. 단위일 뿐이다.' },
  },
  TTWO: {
    cur: '$', period: '', days: 1, src: '',
    equiv: { price: 70, item: '새 게임', unit: '장', priceNote: '새로 나온 게임 1장 가격($70)',
      caveat: '매출의 큰 몫은 게임 속 아이템·추가 결제(GTA 온라인 등)와 모바일 게임에서 나온다. 단위일 뿐이다.' },
  },
  DPZ: {
    cur: '$', period: '2026년 3분기(6월 15일~9월 6일, 12주)', days: 84, src: '2026-10-13 회사 실적 발표',
    rev: { amount: 4.8404e9, label: '전 세계 매장 매출', note: '가맹점을 포함한 전 세계 도미노 매장 매출 48.4억 달러(1년 전보다 +3.2%, 환율 효과 제외). 도미노 회사의 매출은 이 중 가맹점에 파는 밀가루·치즈 등 재료값과 로열티(매출의 약 5.5%)라 훨씬 작다. 매장 2만 2,706개.' },
    equiv: { price: 10, item: '라지 피자', unit: '판', priceNote: '라지 피자 1판 포장 할인가(약 $10. 정상가는 $15 안팎)',
      caveat: '사이드 메뉴·음료·배달비도 섞여 있고 한 번에 여러 판을 시키는 경우가 많다. 나라마다 값도 다르다. 단위일 뿐이다.' },
  },
  YUM: {
    cur: '$', period: '2025년', days: 365, src: '회사 2025년 연차보고서',
    rev: { amount: 68e9, label: '전 세계 매장 매출', note: 'KFC 364억 + 타코벨 184억 + 피자헛 128억 달러 등, 가맹점을 포함한 전 세계 매장 매출 약 680억 달러(매장 6만 3천여 개). 얌 회사의 매출은 이 중 가맹점 로열티 등이라 훨씬 작다(분기 약 22억 달러).' },
    more: [
      { cur: '$', period: '2025년', days: 365, src: '회사 2025년 연차보고서', equivOnly: true,
        rev: { amount: 36.434e9, label: 'KFC 매장 매출', note: 'KFC 전 세계 매장 매출 364억 달러.' },
        equiv: { price: 22.99, item: 'KFC 치킨', unit: '마리', priceNote: '미국 KFC 8조각 버킷(닭 1마리 분량, 약 $22.99)',
          caveat: '버거·사이드·음료도 섞여 있고 나라마다 값이 크게 다르다. 단위일 뿐이다.' } },
      { cur: '$', period: '2025년', days: 365, src: '회사 2025년 연차보고서', equivOnly: true,
        rev: { amount: 18.361e9, label: '타코벨 매장 매출', note: '타코벨 전 세계 매장 매출 184억 달러(대부분 미국).' },
        equiv: { price: 2.19, item: '크런치 타코', unit: '개', priceNote: '미국 타코벨 크런치 타코 1개(약 $2.19)',
          caveat: '부리토·크런치랩·음료 등이 섞여 있다. 단위일 뿐이다.' } },
      { cur: '$', period: '2025년', days: 365, src: '회사 2025년 연차보고서', equivOnly: true,
        rev: { amount: 12.794e9, label: '피자헛 매장 매출', note: '피자헛 전 세계 매장 매출 128억 달러.' },
        equiv: { price: 13, item: '피자헛 라지 피자', unit: '판', priceNote: '미국 피자헛 라지 피자 1판(할인가 $10~정상가 $16, 가운데 약 $13)',
          caveat: '사이드·음료도 섞여 있고 나라마다 값이 다르다. 단위일 뿐이다.' } },
    ],
  },
  CME: {
    cur: '$', period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-02 회사 발표', how: '를 하루 24시간에 고르게 나눈 값. 실제 거래는 장이 열린 시간에 몰리고, 주말·휴일에는 거의 없다.',
    count: { n: 0, perDay: 29.4e6, label: '선물·옵션 계약 체결', unit: '계약', note: '거래일 하루 평균 2,940만 계약(1년 전보다 +16%, 3분기 사상 최대). 금리·주가지수·원자재·외환 선물과 옵션.' },
  },
  IBKR: {
    cur: '$', period: '2026년 9월', days: 30, src: '2026-10-01 회사 월간 발표', how: '를 하루 24시간에 고르게 나눈 값. 실제 거래는 장이 열린 시간에 몰리고, 주말·휴일에는 거의 없다.',
    count: { n: 0, perDay: 4.111e6, label: '고객 주문 체결', unit: '건', note: '거래일 하루 평균 수익 주문 411만 건(1년 전보다 +6%). 고객 계좌 558만 개.' },
  },
  SCHW: {
    cur: '$', period: '2026년 3분기(7~9월)', days: 92, src: '2026-10-15 회사 실적 발표', how: '를 하루 24시간에 고르게 나눈 값. 실제 거래는 장이 열린 시간에 몰리고, 주말·휴일에는 거의 없다.',
    count: { n: 0, perDay: 10.7e6, label: '고객 매매', unit: '건', note: '거래일 하루 평균 1,070만 건(1년 전보다 +44%).' },
  },
  META: {
    cur: '$', period: '2026년 2분기(4~6월)', days: 91, src: '2026-07-29 회사 실적 발표',
    level: { value: '36억 명', label: '하루에 쓰는 사람', note: '페이스북·인스타그램·왓츠앱·메신저 중 하나라도 하루에 쓴 사람 36억 명(2026년 6월 평균, 1년 전보다 +3%). 세계 인구(약 82억 명)의 40%대. 회사 추정치라 오차가 있다.' },
    rev: { amount: 60.8e9, label: '광고 등 매출', note: '회사 전체 매출 608억 달러(1년 전보다 +28%). 대부분 광고.' },
  },
  BKNG: {
    cur: '$', period: '2026년 2분기(4~6월)', days: 91, src: '2026년 7월 회사 실적 발표',
    count: { n: 325e6, label: '숙박 예약', unit: '박', note: '부킹닷컴·아고다 등에서 예약된 숙박 3억 2,500만 박(1년 전보다 +5%). 1박 = 방 1개를 하룻밤.' },
  },
  HD: {
    cur: '$', period: '2026 회계연도 2분기(2026년 5~7월, 13주)', days: 91, src: '2026년 8월 회사 분기 보고서',
    count: { n: 443.2e6, label: '계산대 결제', unit: '건', note: '고객 결제 4억 4,320만 건(1년 전보다 −0.8%), 1건 평균 $92.50. 손님 수는 조금 줄고 한 번에 쓰는 돈이 늘었다.' },
  },
  NFLX: {
    cur: '$', period: '2026년 상반기(1~6월)', days: 181, src: '2026년 7월 회사 시청 보고서',
    count: { n: 97e9, label: '전 세계 시청', unit: '시간', note: '회원들이 본 시간 970억 시간 이상(1년 전보다 +2%, 반기 사상 최대). 1초마다 약 6천 시간, 즉 1초에 약 8개월 분량이 재생되는 셈.' },
  },
  VRSN: {
    cur: '$', period: '2026년 2분기(4~6월)', days: 91, src: '2026-07-23 회사 발표',
    count: { n: 12.7e6, label: '새 .com·.net 주소 등록', unit: '개', note: '새로 등록된 .com·.net 인터넷 주소 1,270만 개(1년 전 1,040만 개). 전체 등록 수는 1억 7,910만 개이고, 이미 있는 주소도 해마다 갱신료를 낸다.' },
  },
  KO: {
    cur: '$', period: '2025년 기준', days: 1, src: '회사 2026년 주주총회 자료', how: '를 하루 24시간에 고르게 나눈 값.',
    count: { n: 0, perDay: 2.2e9, label: '코카콜라 음료 마시는 횟수', unit: '잔', note: '200개 넘는 나라에서 하루 약 22억 잔(1잔 = 1회 제공량). 콜라뿐 아니라 스프라이트·환타·생수·커피 등 회사의 모든 음료. 회사 추정치.' },
  },
}

// 직접 조사한 숫자가 없는 종목: SEC 분기 보고서의 가장 최근 분기 매출로 매출 시계만 만든다
function revQClock(q?: { start: string; end: string; rev: number; prev?: number }, ni?: number | null): SalesClock | null {
  if (!q || !(q.rev > 0)) return null
  if (ni != null && ni > q.rev * 4) return null // 1년 순이익보다 작으면 매출 일부만 잡힌 것(일부 은행) — 보여 주지 않음
  const s = new Date(q.start), e = new Date(q.end)
  const days = Math.round((e.getTime() - s.getTime()) / 86400000) + 1
  if (days < 80 || days > 115) return null
  if ((Date.now() - e.getTime()) / 86400000 > 240) return null // 너무 오래된 숫자는 쓰지 않음 (SEC 데이터에 최신 분기가 늦게 들어오는 종목이 있어 두 분기 전까지 허용)
  const sm = s.getUTCMonth() + 1, em = e.getUTCMonth() + 1
  const period = `${s.getUTCFullYear() === e.getUTCFullYear() ? '' : `${s.getUTCFullYear()}년 ${sm}월~`}${e.getUTCFullYear()}년 ${s.getUTCFullYear() === e.getUTCFullYear() ? `${sm}~` : ''}${em}월`
  const g = q.prev ? (q.rev / q.prev - 1) * 100 : null
  const amt = q.rev >= 1000 ? `${(q.rev / 100).toFixed(0)}억 달러` : `${(q.rev / 100).toFixed(1)}억 달러`
  return {
    cur: '$', period, days, src: 'SEC 분기·연간 보고서',
    rev: { amount: q.rev * 1e6, label: '매출', note: `가장 최근 분기 매출 ${amt}${g != null ? `(1년 전 같은 분기보다 ${g >= 0 ? '+' : ''}${g.toFixed(1)}%)` : ''}. 회사가 판매 개수·건수를 따로 공개하지 않거나 아직 조사하지 않은 종목이라 매출만 보여 준다.` },
  }
}

function salesClockTiles(c: SalesClock, now: number): LiveTile[] {
  const startOfDay = new Date(new Date(now).setHours(0, 0, 0, 0)).getTime()
  const sinceToday = (now - startOfDay) / 86400000 // 오늘 지난 비율(일)
  const money = (v: number) => `${c.cur}${Math.round(v).toLocaleString('ko-KR')}`
  const n0 = (v: number) => Math.floor(v).toLocaleString('ko-KR')
  const head = <>{c.period} 숫자({c.src}){c.how ?? `를 그 기간 날짜 수(${c.days}일)로 나눈 값.`} </>
  const tiles: LiveTile[] = []
  if (c.level) tiles.push({ label: c.level.label, value: c.level.value, tip: <>{c.period} 숫자({c.src}). {c.level.note}</> })
  if (c.count) {
    const perDay = c.count.perDay ?? c.count.n / c.days
    const perSec = perDay / 86400
    const ap = c.count.approx ? '약 ' : ''
    tiles.push({
      rate: { perSec, what: c.count.label, unit: c.count.unit },
      label: `${c.count.label}: 1초`,
      value: perSec >= 1 ? `${ap}${Math.round(perSec).toLocaleString('ko-KR')}${c.count.unit}` : `${ap}${(1 / perSec).toFixed(1)}초에 1${c.count.unit}`,
      tip: <>{head}{c.count.note} 하루 약 {Math.round(perDay).toLocaleString('ko-KR')}{c.count.unit}. <b>회사가 공개한 실제 횟수</b>를 고르게 나눈 것이라, 실제로는 시간대·요일마다 다르다.</>,
    })
    tiles.push({ label: `${c.count.label}: 오늘 0시부터`, value: `${ap}${n0(perDay * sinceToday)}${c.count.unit}`, tip: <>{head}{c.count.note}</> })
  }
  if (c.rev) {
    const perDay = c.rev.amount / c.days
    if (!c.equivOnly) tiles.push({ label: `${c.rev.label}: 1초`, value: money(perDay / 86400), tip: <>{head}{c.rev.note} 하루 약 {c.cur}{(perDay / 1e6).toFixed(1)}백만.</> })
    if (!c.count && !c.equivOnly) tiles.push({ label: `${c.rev.label}: 오늘 0시부터`, value: money(perDay * sinceToday), tip: <>{head}{c.rev.note}</> })
    if (c.equiv) {
      const e = c.equiv
      const perDayN = perDay / e.price
      const perSecN = perDayN / 86400
      const secText = perSecN >= 1 ? `1초에 약 ${perSecN >= 10 ? Math.round(perSecN).toLocaleString('ko-KR') : perSecN.toFixed(1)}${e.unit}` : `약 ${(1 / perSecN).toFixed(1)}초에 1${e.unit}`
      tiles.push({
        rate: { perSec: perSecN, what: e.item, unit: e.unit },
        label: `${e.item} 몇 ${e.unit} 값: 1초`, value: secText.replace('1초에 ', ''),
        tip: <>{head}{c.rev.label}을 {e.priceNote}로 나눈 값. {secText}, 하루 약 {perDayN >= 1e5 ? `${(perDayN / 1e4).toFixed(1)}만` : Math.round(perDayN).toLocaleString('ko-KR')}{e.unit} 값.
          <br /><b>주의:</b> 실제로 {e.item}만 이만큼 팔린다는 뜻이 아니다. {e.caveat}</>,
      })
      tiles.push({
        label: `${e.item} 몇 ${e.unit} 값: 오늘 0시부터`, value: `${n0(perDay * sinceToday / e.price)}${e.unit}`,
        tip: <>{head}오늘 {c.rev.label}을 {e.priceNote}로 나눈 값. {secText}, 하루 약 {perDayN >= 1e5 ? `${(perDayN / 1e4).toFixed(1)}만` : Math.round(perDayN).toLocaleString('ko-KR')}{e.unit} 값.
          <br /><b>주의:</b> 실제로 {e.item}만 이만큼 팔린다는 뜻이 아니다. {e.caveat}</>,
      })
    }
  }
  return tiles
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
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
        <RollingChart key={`chart-${current.key}`} data={current.data} />

        {/* 롤링 테이블 */}
        <RollingTable data={current.data} />

        {/* 에르메스 전용 인사이트 */}
        {current.key === 'RMS' && <QualityCard stockKey="RMS" />}
        {current.key === 'RMS' && <RmsInsight data={current.data} />}
        {current.key === 'NKE' && <QualityCard stockKey="NKE" />}
        {current.key === 'NKE' && <NkeInsight data={current.data} />}
        {current.key !== 'RMS' && current.key !== 'NKE' && (current.data as any).type !== 'etf' && (
          <AutoInsight key={`insight-${current.key}`} stockKey={current.key} data={current.data} />
        )}


      </div>
    </div>
  )
}
