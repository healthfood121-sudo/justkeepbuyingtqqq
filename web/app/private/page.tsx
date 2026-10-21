'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement,
  Tooltip, Legend,
} from 'chart.js'
import { Chart } from 'react-chartjs-2'
import spDesc from '@/app/sp500-holdings/descriptions.json'
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

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend)

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
              const peBuy   = 'peBuy' in r ? (r as any).peBuy as number : null
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
function ScenarioTable({ data }: { data: StockData }) {
  const c = data.current as { price: number; pe: number; divYield: number; eps: number }
  const [pe,  setPE]  = useState(c.pe ?? 20)
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
          지금 사서 10년 보유 시 예상 수익률
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

// ── 범용 Range Bar ───────────────────────────────────────────
function RangeBar({
  mn, med, mx,
  vMin, vMax,
  refVal, refLabel,
  barColor = 'bg-blue-200 dark:bg-blue-900',
  markerColor = 'bg-blue-500 dark:bg-blue-400',
  refColor = 'bg-blue-400 dark:bg-blue-500',
  unit = '%',
  sign = false,
}: {
  mn: number; med: number; mx: number
  vMin: number; vMax: number
  refVal: number; refLabel: string
  barColor?: string; markerColor?: string; refColor?: string
  unit?: string; sign?: boolean
}) {
  const toX = (v: number) =>
    `${Math.max(0, Math.min(100, (v - vMin) / (vMax - vMin) * 100)).toFixed(2)}%`
  const refPct = ((refVal - vMin) / (vMax - vMin) * 100).toFixed(2)
  const fmt = (v: number) => `${sign && v > 0 ? '+' : ''}${v.toFixed(1)}${unit}`

  return (
    <div className="relative group flex items-center" style={{ width: 165, height: 44 }}>
      {/* 배경 트랙 */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 bg-gray-100 dark:bg-gray-800 rounded-full" />
      {/* min~max 구간 바 */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 h-3 rounded-full ${barColor}`}
        style={{ left: toX(mn), right: `${(100 - parseFloat(toX(mx))).toFixed(2)}%` }}
      />
      {/* 기준선 */}
      <div
        className={`absolute top-0 h-full w-0.5 opacity-70 ${refColor}`}
        style={{ left: `${refPct}%` }}
      />
      {/* 중앙값 마커 */}
      <div
        className={`absolute top-1/2 w-5 h-5 rounded-full border-2 border-white dark:border-gray-950 ${markerColor}`}
        style={{ left: toX(med), transform: 'translateX(-50%) translateY(-50%)' }}
      />
      {/* 툴팁 — 위쪽으로 표시, overflow 문제 없도록 fixed */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                      invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-150
                      bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2
                      whitespace-nowrap shadow-lg pointer-events-none">
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">최솟값</span>
            <span className="font-semibold">{fmt(mn)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">중앙값 ●</span>
            <span className="font-semibold">{fmt(med)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">최댓값</span>
            <span className="font-semibold">{fmt(mx)}</span>
          </div>
          <div className="border-t border-gray-600 pt-1 text-gray-400">
            세로선 | = {refLabel}
          </div>
        </div>
      </div>
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

type SortKey = 'fullCagr' | 'cagrMn' | 'cagrMed' | 'cagrMx' | 'diffMn' | 'diffMed' | 'diffMx'

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
  const [minPeriods, setMinPeriods] = useState(0)
  const [minCagrMin, setMinCagrMin] = useState<number | ''>('')
  const [minMedian, setMinMedian] = useState(0)
  const [minDiffMin, setMinDiffMin] = useState<number | ''>('')
  const [minDiffMedian, setMinDiffMedian] = useState(0)
  const [maxRange, setMaxRange] = useState<number | ''>('')
  const [excludeEtf, setExcludeEtf] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('private_starred')
      if (saved) setStarred(new Set(JSON.parse(saved)))
    } catch {}
    try {
      const f = JSON.parse(localStorage.getItem('private_filters') ?? '{}')
      if (f.minPeriods != null)  setMinPeriods(f.minPeriods)
      if (f.minCagrMin != null)  setMinCagrMin(f.minCagrMin)
      if (f.minMedian != null)   setMinMedian(f.minMedian)
      if (f.minDiffMin != null)  setMinDiffMin(f.minDiffMin)
      if (f.minDiffMedian != null) setMinDiffMedian(f.minDiffMedian)
      if (f.maxRange != null)    setMaxRange(f.maxRange)
      if (f.excludeEtf != null)  setExcludeEtf(f.excludeEtf)
      if (f.sortKey)             setSortKey(f.sortKey)
      if (f.sortDir)             setSortDir(f.sortDir)
      if (f.viewMode)            setViewMode(f.viewMode)
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('private_filters', JSON.stringify({
        minPeriods, minCagrMin, minMedian, minDiffMin, minDiffMedian, maxRange, excludeEtf, sortKey, sortDir, viewMode,
      }))
    } catch {}
  }, [minPeriods, minCagrMin, minMedian, minDiffMin, minDiffMedian, maxRange, excludeEtf, sortKey, sortDir, viewMode])

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
        className={`cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors ${colBg(col)} ${className ?? ''}`}
        onClick={() => handleSort(col)}
      >
        {children}<SortIcon col={col} />
      </th>
    )
  }

  const allRows = STOCKS.map((s, i) => {
    const allCompleted = s.data.rows10y.filter((r: any) => r.isComplete)
    const completedCount = allCompleted.length
    const completed  = allCompleted.slice(-15)
    const cagrs      = completed.map((r: any) => r.cagr as number)
    const cagrMn     = Math.min(...cagrs)
    const cagrMx     = Math.max(...cagrs)
    const cagrMed    = median(cagrs)
    const withDiff   = completed.filter((r: any) => r.diff != null)
    const diffs      = withDiff.map((r: any) => r.diff as number)
    const diffMn     = diffs.length ? Math.min(...diffs) : null
    const diffMx     = diffs.length ? Math.max(...diffs) : null
    const diffMed    = diffs.length ? median(diffs) : null
    const fullCagr   = s.data.fullPeriod.cagr
    return { i, s, fullCagr, cagrMn, cagrMed, cagrMx, diffMn, diffMed, diffMx, completedCount }
  }).sort((a, b) => {
    const va = a[sortKey] ?? -Infinity
    const vb = b[sortKey] ?? -Infinity
    return sortDir === 'desc' ? vb - va : va - vb
  })

  function percentile(arr: number[], p: number) {
    const s = [...arr].sort((a, b) => a - b)
    return s[Math.min(Math.floor(s.length * p), s.length - 1)]
  }
  const cagrVMax = Math.ceil(percentile(allRows.map(r => r.cagrMx), 0.95) / 10) * 10
  const diffVMax = Math.ceil(percentile(allRows.filter(r => r.diffMx != null).map(r => r.diffMx!), 0.95) / 10) * 10
  const diffVMin = Math.floor(percentile(allRows.filter(r => r.diffMn != null).map(r => r.diffMn!), 0.05) / 10) * 10

  const rows = allRows.filter(row => {
    const q = search.trim().toLowerCase()
    if (q && !row.s.key.toLowerCase().includes(q) && !row.s.data.name.toLowerCase().includes(q)) return false
    if (viewMode === 'starred' && !starred.has(row.s.key)) return false
    if (minPeriods > 0 && row.completedCount < minPeriods) return false
    if (minCagrMin !== '' && row.cagrMn < minCagrMin) return false
    if (minMedian > 0 && row.cagrMed < minMedian) return false
    if (minDiffMin !== '' && (row.diffMn == null || row.diffMn < minDiffMin)) return false
    if (minDiffMedian !== 0 && (row.diffMed == null || row.diffMed < minDiffMedian)) return false
    if (maxRange !== '' && (row.cagrMx - row.cagrMn) > maxRange) return false
    if (excludeEtf && (row.s.data as any).type === 'etf') return false
    return true
  })

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

      {/* 필터 행 */}
      {(() => {
        const inputCls = "w-9 text-center bg-transparent text-gray-900 dark:text-white focus:outline-none"
        const labelCls = "flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5"
        const hasFilter = minPeriods > 0 || minCagrMin !== '' || minMedian > 0 || minDiffMin !== '' || minDiffMedian !== 0 || maxRange !== '' || excludeEtf
        return (
          <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
            <label className={labelCls}>
              완결 구간
              <input type="number" min={0} max={40} value={minPeriods || ''} placeholder="0"
                onChange={e => setMinPeriods(Number(e.target.value) || 0)} className={inputCls} />
              개 이상
            </label>
            <label className={labelCls}>
              절대수익 최솟값 ≥
              <input type="number" min={-30} max={100} value={minCagrMin} placeholder="—"
                onChange={e => setMinCagrMin(e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} />
              %
            </label>
            <label className={labelCls}>
              절대수익 중앙값 ≥
              <input type="number" min={0} max={100} value={minMedian || ''} placeholder="0"
                onChange={e => setMinMedian(Number(e.target.value) || 0)} className={inputCls} />
              %
            </label>
            <label className={labelCls}>
              초과수익 최솟값 ≥
              <input type="number" min={-50} max={100} value={minDiffMin} placeholder="—"
                onChange={e => setMinDiffMin(e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} />
              pp
            </label>
            <label className={labelCls}>
              초과수익 중앙값 ≥
              <input type="number" min={-20} max={100} value={minDiffMedian || ''} placeholder="0"
                onChange={e => setMinDiffMedian(Number(e.target.value) || 0)} className={inputCls} />
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
              <input type="number" min={0} max={200} value={maxRange} placeholder="—"
                onChange={e => setMaxRange(e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} />
              %
            </label>
            <button onClick={() => setExcludeEtf(v => !v)}
              className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
                excludeEtf
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
                <button onClick={() => { setMinPeriods(0); setMinCagrMin(''); setMinMedian(0); setMinDiffMin(''); setMinDiffMedian(0); setMaxRange(''); setExcludeEtf(false) }}
                  className="text-xs text-gray-400 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-500 transition-colors">
                  초기화
                </button>
              )}
            </div>
          </div>
        )
      })()}

      <table className="text-sm">
        <thead>
          <tr className="text-xs text-gray-400 dark:text-gray-500">
            <th rowSpan={2} className="pb-1 pr-1 w-6" />
            <th className="text-left pb-1 pr-4" rowSpan={2}>종목</th>
            <th colSpan={4} className="text-center pb-1 px-3 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold">
              절대 수익률 <span className="font-normal opacity-60">(배당 포함)</span>
            </th>
            <th colSpan={4} className="text-center pb-1 px-3 border-b border-l-2 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold">
              S&P 500 대비 초과수익
            </th>
          </tr>
          <tr className="text-xs text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-1 px-3 font-medium">분포</th>
            <SortTh col="cagrMn"  className="text-right py-1 pr-3 font-medium">최솟값</SortTh>
            <SortTh col="cagrMed" className="text-right py-1 pr-3 font-medium">중앙값</SortTh>
            <SortTh col="cagrMx"  className="text-right py-1 pr-4 font-medium">최댓값</SortTh>
            <th className="text-left py-1 px-3 font-medium border-l-2 border-gray-200 dark:border-gray-700">분포</th>
            <SortTh col="diffMn"  className="text-right py-1 pr-3 font-medium">최솟값</SortTh>
            <SortTh col="diffMed" className="text-right py-1 pr-3 font-medium">중앙값</SortTh>
            <SortTh col="diffMx"  className="text-right py-1 font-medium">최댓값</SortTh>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.length === 0 && (
            <tr>
              <td colSpan={10} className="py-8 text-center text-sm text-gray-400 dark:text-gray-600">
                조건에 맞는 종목이 없습니다
              </td>
            </tr>
          )}
          {rows.map(({ i, s, cagrMn, cagrMed, cagrMx, diffMn, diffMed, diffMx }) => {
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
                <td className="py-1.5 pr-4">
                  <div className="group/name relative inline-flex items-baseline gap-1.5 max-w-[140px]">
                    <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">{s.data.ticker}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{s.data.name}</span>
                    {(() => {
                      const desc = (spDesc as any)[s.data.ticker]
                      return (
                        <div className="absolute bottom-full left-0 mb-1.5 z-50 w-64
                                        invisible group-hover/name:visible opacity-0 group-hover/name:opacity-100
                                        transition-opacity duration-150 pointer-events-none
                                        bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md px-3 py-2
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
                {/* 절대 수익률 */}
                <td className="py-1.5 px-3">
                  <RangeBar mn={cagrMn} med={cagrMed} mx={cagrMx}
                    vMin={0} vMax={cagrVMax} refVal={20} refLabel="연 20% 기준" />
                </td>
                <td className={`py-1.5 pr-3 text-right tabular-nums ${cagrTextColor(cagrMn, true)} ${colBg('cagrMn')}`}>
                  {cagrMn.toFixed(1)}%
                </td>
                <td className={`py-1.5 pr-3 text-right tabular-nums font-semibold ${cagrTextColor(cagrMed, true)} ${colBg('cagrMed')}`}>
                  {cagrMed.toFixed(1)}%
                </td>
                <td className={`py-1.5 pr-4 text-right tabular-nums ${cagrTextColor(cagrMx, true)} ${colBg('cagrMx')}`}>
                  {cagrMx.toFixed(1)}%
                </td>
                {/* S&P500 초과수익 */}
                <td className="py-1.5 px-3 border-l-2 border-gray-200 dark:border-gray-700">
                  {diffMn != null && diffMed != null && diffMx != null ? (
                    <RangeBar mn={diffMn} med={diffMed} mx={diffMx}
                      vMin={diffVMin} vMax={diffVMax} refVal={0} refLabel="0pp = S&P500과 동일"
                      barColor="bg-emerald-200 dark:bg-emerald-900"
                      markerColor="bg-emerald-600 dark:bg-emerald-400"
                      refColor="bg-gray-400 dark:bg-gray-500"
                      sign unit="pp" />
                  ) : <span className="text-gray-300 dark:text-gray-600 text-xs pl-3">—</span>}
                </td>
                <td className={`py-1.5 pr-3 text-right tabular-nums ${diffMn != null ? diffColor(diffMn) : 'text-gray-300'} ${colBg('diffMn')}`}>
                  {diffMn != null ? `${diffMn > 0 ? '+' : ''}${diffMn.toFixed(1)}pp` : '—'}
                </td>
                <td className={`py-1.5 pr-3 text-right tabular-nums font-semibold ${diffMed != null ? diffColor(diffMed) : 'text-gray-300'} ${colBg('diffMed')}`}>
                  {diffMed != null ? `${diffMed > 0 ? '+' : ''}${diffMed.toFixed(1)}pp` : '—'}
                </td>
                <td className={`py-1.5 text-right tabular-nums ${diffMx != null ? diffColor(diffMx) : 'text-gray-300'} ${colBg('diffMx')}`}>
                  {diffMx != null ? `${diffMx > 0 ? '+' : ''}${diffMx.toFixed(1)}pp` : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        행 클릭 시 상세 보기 · ★ 클릭으로 즐겨찾기 · 최근 15개 완결 구간 기준
      </p>
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

        {/* 구분선 */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-2" />

        {/* 시나리오 테이블 — ETF는 미래 P/E 시나리오 의미 없으므로 숨김 */}
        {(current.data as any).type !== 'etf' && (
          <ScenarioTable key={`scenario-${current.key}`} data={current.data} />
        )}

      </div>
    </div>
  )
}
