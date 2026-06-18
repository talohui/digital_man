import type { LingshanMap3DGardenAsset } from './lingshanMap3DGardenAssets'
import { normalizeLingshanTreeAssetScale } from './lingshanTreeScaleNormalization'

// User-curated manual tree placement exported from Tree Candidate Lab.
// This file is the default garden asset set for /map-3d-guide-c.
// Legacy deterministic 199-tree assets remain exported from lingshanMap3DGardenAssets.ts.
const LINGSHAN_MANUAL_TREE_ASSETS_RAW = [
  {
    "id": "tree-lab-fluffy_round_tree-1781598324740-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0001",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425721,
      "lng": 120.100104
    },
    "scale": 88.05,
    "height": 1.8,
    "yaw": -94,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598324740-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598324740; clusterMode=single; candidateType=fluffy_round_tree; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598413124-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0002",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427301,
      "lng": 120.093538
    },
    "scale": 0.98,
    "height": -0.3,
    "yaw": 154,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598413124-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598413124; clusterMode=mediumCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598413124-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0003",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427391,
      "lng": 120.093811
    },
    "scale": 0.99,
    "height": -0.4,
    "yaw": -5,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598413124-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598413124; clusterMode=mediumCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598413124-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0004",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427523,
      "lng": 120.093405
    },
    "scale": 1,
    "height": 0.4,
    "yaw": -166,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598413124-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598413124; clusterMode=mediumCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598413124-4",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0005",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427176,
      "lng": 120.093408
    },
    "scale": 1.01,
    "height": 0.3,
    "yaw": 29,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598413124-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598413124; clusterMode=mediumCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598413124-5",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0006",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427282,
      "lng": 120.093763
    },
    "scale": 1.02,
    "height": 0.2,
    "yaw": -137,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598413124-5; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598413124; clusterMode=mediumCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598418786-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0007",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429057,
      "lng": 120.096412
    },
    "scale": 1.07,
    "height": 0.2,
    "yaw": 99,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598418786-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598418786; clusterMode=mediumCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598418786-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0008",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429186,
      "lng": 120.096398
    },
    "scale": 1.07,
    "height": 0.1,
    "yaw": -73,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598418786-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598418786; clusterMode=mediumCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598418786-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0009",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.42918,
      "lng": 120.09609
    },
    "scale": 1.07,
    "height": 0,
    "yaw": 113,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598418786-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598418786; clusterMode=mediumCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598418786-4",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0010",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.428915,
      "lng": 120.096395
    },
    "scale": 1.07,
    "height": -0.1,
    "yaw": -63,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598418786-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598418786; clusterMode=mediumCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598418786-5",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0011",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429224,
      "lng": 120.096577
    },
    "scale": 1.06,
    "height": -0.2,
    "yaw": 118,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598418786-5; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598418786; clusterMode=mediumCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598419857-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0012",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429014,
      "lng": 120.096022
    },
    "scale": 1.1,
    "height": -0.2,
    "yaw": -19,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598419857-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598419857; clusterMode=mediumCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598419857-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0013",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429144,
      "lng": 120.095864
    },
    "scale": 1.09,
    "height": -0.3,
    "yaw": 157,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598419857-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598419857; clusterMode=mediumCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598419857-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0014",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429003,
      "lng": 120.095811
    },
    "scale": 1.08,
    "height": 0.4,
    "yaw": -29,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598419857-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598419857; clusterMode=mediumCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598419857-4",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0015",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429253,
      "lng": 120.095976
    },
    "scale": 1.06,
    "height": 0.2,
    "yaw": 142,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598419857-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598419857; clusterMode=mediumCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598419857-5",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0016",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429065,
      "lng": 120.095641
    },
    "scale": 1.04,
    "height": 0.1,
    "yaw": -50,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598419857-5; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598419857; clusterMode=mediumCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598421033-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0017",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429321,
      "lng": 120.095623
    },
    "scale": 1.07,
    "height": 0.1,
    "yaw": 161,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598421033-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598421033; clusterMode=mediumCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598421033-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0018",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429324,
      "lng": 120.095353
    },
    "scale": 1.04,
    "height": -0.1,
    "yaw": -35,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598421033-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598421033; clusterMode=mediumCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598421033-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0019",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429142,
      "lng": 120.095447
    },
    "scale": 1.02,
    "height": -0.2,
    "yaw": 126,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598421033-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598421033; clusterMode=mediumCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598421033-4",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0020",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429284,
      "lng": 120.095458
    },
    "scale": 0.99,
    "height": -0.4,
    "yaw": -76,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598421033-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598421033; clusterMode=mediumCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598421033-5",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0021",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.42911,
      "lng": 120.09527
    },
    "scale": 0.95,
    "height": 0.3,
    "yaw": 80,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598421033-5; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598421033; clusterMode=mediumCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598424871-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0022",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429717,
      "lng": 120.095057
    },
    "scale": 0.97,
    "height": 0.2,
    "yaw": -82,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598424871-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598424871; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598424871-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0023",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429381,
      "lng": 120.094635
    },
    "scale": 0.93,
    "height": 0,
    "yaw": 69,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598424871-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598424871; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598424871-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0024",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.42921,
      "lng": 120.09511
    },
    "scale": 0.89,
    "height": -0.1,
    "yaw": -143,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598424871-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598424871; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598424871-4",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0025",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429588,
      "lng": 120.095117
    },
    "scale": 0.85,
    "height": -0.3,
    "yaw": 3,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598424871-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598424871; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598424871-5",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0026",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429486,
      "lng": 120.094782
    },
    "scale": 0.8,
    "height": 0.3,
    "yaw": 146,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598424871-5; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598424871; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598424871-6",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0027",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429344,
      "lng": 120.094946
    },
    "scale": 0.75,
    "height": 0.1,
    "yaw": -73,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598424871-6; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598424871; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598424871-7",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0028",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429454,
      "lng": 120.095442
    },
    "scale": 1.1,
    "height": -0.1,
    "yaw": 65,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598424871-7; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598424871; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598424871-8",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0029",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429798,
      "lng": 120.094853
    },
    "scale": 1.05,
    "height": -0.3,
    "yaw": -159,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598424871-8; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598424871; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598426194-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0030",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429745,
      "lng": 120.095828
    },
    "scale": 1.05,
    "height": -0.4,
    "yaw": 19,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598426194-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598426194; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598426194-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0031",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429195,
      "lng": 120.095793
    },
    "scale": 0.99,
    "height": 0.2,
    "yaw": 149,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598426194-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598426194; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598426194-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0032",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429373,
      "lng": 120.096344
    },
    "scale": 0.93,
    "height": 0,
    "yaw": -83,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598426194-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598426194; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598426194-4",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0033",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429704,
      "lng": 120.095991
    },
    "scale": 0.86,
    "height": -0.3,
    "yaw": 43,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598426194-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598426194; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598426194-5",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0034",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429366,
      "lng": 120.095778
    },
    "scale": 0.8,
    "height": 0.3,
    "yaw": 166,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598426194-5; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598426194; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598426194-6",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0035",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429312,
      "lng": 120.096132
    },
    "scale": 1.13,
    "height": 0.1,
    "yaw": -74,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598426194-6; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598426194; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598426194-7",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0036",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429507,
      "lng": 120.096079
    },
    "scale": 1.06,
    "height": -0.2,
    "yaw": 44,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598426194-7; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598426194; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598426194-8",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0037",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429668,
      "lng": 120.095609
    },
    "scale": 0.98,
    "height": -0.4,
    "yaw": 159,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598426194-8; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598426194; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598427253-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0038",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429985,
      "lng": 120.097046
    },
    "scale": 0.96,
    "height": 0.3,
    "yaw": -44,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598427253-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598427253; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598427253-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0039",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429528,
      "lng": 120.097509
    },
    "scale": 0.88,
    "height": 0,
    "yaw": 66,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598427253-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598427253; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598427253-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0040",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430033,
      "lng": 120.09779
    },
    "scale": 0.79,
    "height": -0.3,
    "yaw": 174,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598427253-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598427253; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598427253-4",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0041",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430069,
      "lng": 120.097196
    },
    "scale": 1.11,
    "height": 0.3,
    "yaw": -81,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598427253-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598427253; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598427253-5",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0042",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429633,
      "lng": 120.097332
    },
    "scale": 1.02,
    "height": 0,
    "yaw": 22,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598427253-5; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598427253; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598427253-6",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0043",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429837,
      "lng": 120.097715
    },
    "scale": 0.93,
    "height": -0.3,
    "yaw": 121,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598427253-6; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598427253; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598427253-7",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0044",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430041,
      "lng": 120.097451
    },
    "scale": 0.84,
    "height": 0.2,
    "yaw": -141,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598427253-7; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598427253; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598427253-8",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0045",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.42986,
      "lng": 120.097376
    },
    "scale": 1.14,
    "height": 0,
    "yaw": -46,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598427253-8; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598427253; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598428121-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0046",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.43062,
      "lng": 120.097759
    },
    "scale": 1.1,
    "height": -0.2,
    "yaw": 90,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598428121-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598428121; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598428121-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0047",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430563,
      "lng": 120.09852
    },
    "scale": 1,
    "height": 0.3,
    "yaw": 179,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598428121-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598428121; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598428121-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0048",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.431141,
      "lng": 120.098293
    },
    "scale": 0.89,
    "height": 0,
    "yaw": -94,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598428121-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598428121; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598428121-4",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0049",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430782,
      "lng": 120.097786
    },
    "scale": 0.79,
    "height": -0.3,
    "yaw": -10,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598428121-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598428121; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598428121-5",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0050",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430515,
      "lng": 120.098295
    },
    "scale": 1.08,
    "height": 0.1,
    "yaw": 72,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598428121-5; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598428121; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598428121-6",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0051",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430949,
      "lng": 120.098432
    },
    "scale": 0.97,
    "height": -0.2,
    "yaw": 151,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598428121-6; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598428121; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598428121-7",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0052",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430953,
      "lng": 120.097986
    },
    "scale": 0.85,
    "height": 0.3,
    "yaw": -132,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598428121-7; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598428121; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598428121-8",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0053",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430665,
      "lng": 120.098066
    },
    "scale": 1.14,
    "height": 0,
    "yaw": -58,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598428121-8; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598428121; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598429486-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0054",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429986,
      "lng": 120.097649
    },
    "scale": 1.07,
    "height": -0.3,
    "yaw": 57,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598429486-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598429486; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598429486-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0055",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430425,
      "lng": 120.098284
    },
    "scale": 0.95,
    "height": 0.2,
    "yaw": 126,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598429486-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598429486; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598429486-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0056",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430728,
      "lng": 120.097602
    },
    "scale": 0.82,
    "height": -0.2,
    "yaw": -168,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598429486-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598429486; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598429486-4",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0057",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430121,
      "lng": 120.097522
    },
    "scale": 1.1,
    "height": 0.3,
    "yaw": -104,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598429486-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598429486; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598429486-5",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0058",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430239,
      "lng": 120.098164
    },
    "scale": 0.97,
    "height": -0.1,
    "yaw": -44,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598429486-5; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598429486; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598429486-6",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0059",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430684,
      "lng": 120.097883
    },
    "scale": 0.83,
    "height": 0.4,
    "yaw": 15,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598429486-6; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598429486; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598429486-7",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0060",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430385,
      "lng": 120.097499
    },
    "scale": 1.1,
    "height": 0,
    "yaw": 71,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598429486-7; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598429486; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598429486-8",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0061",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.43017,
      "lng": 120.097853
    },
    "scale": 0.96,
    "height": -0.4,
    "yaw": 124,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598429486-8; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598429486; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598430915-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0062",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.431175,
      "lng": 120.096996
    },
    "scale": 0.87,
    "height": 0.1,
    "yaw": -143,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598430915-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598430915; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598430915-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0063",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.431296,
      "lng": 120.096946
    },
    "scale": 1.13,
    "height": -0.2,
    "yaw": -95,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598430915-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598430915; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598430915-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0064",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.431414,
      "lng": 120.096476
    },
    "scale": 0.98,
    "height": 0.2,
    "yaw": -50,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598430915-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598430915; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598430915-4",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0065",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430894,
      "lng": 120.096945
    },
    "scale": 0.83,
    "height": -0.2,
    "yaw": -7,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598430915-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598430915; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598430915-5",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0066",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.431399,
      "lng": 120.097343
    },
    "scale": 1.08,
    "height": 0.2,
    "yaw": 33,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598430915-5; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598430915; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598430915-6",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0067",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.43157,
      "lng": 120.096723
    },
    "scale": 0.93,
    "height": -0.2,
    "yaw": 70,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598430915-6; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598430915; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598430915-7",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0068",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.431073,
      "lng": 120.096679
    },
    "scale": 0.77,
    "height": 0.1,
    "yaw": 105,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598430915-7; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598430915; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598430915-8",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0069",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.431127,
      "lng": 120.097183
    },
    "scale": 1.01,
    "height": -0.3,
    "yaw": 137,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598430915-8; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598430915; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598431899-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0070",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430785,
      "lng": 120.095614
    },
    "scale": 0.9,
    "height": 0.2,
    "yaw": -151,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598431899-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598431899; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598431899-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0071",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430999,
      "lng": 120.095393
    },
    "scale": 1.13,
    "height": -0.2,
    "yaw": -124,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598431899-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598431899; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598431899-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0072",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430819,
      "lng": 120.095325
    },
    "scale": 0.96,
    "height": 0.1,
    "yaw": -100,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598431899-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598431899; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598431899-4",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0073",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430558,
      "lng": 120.095753
    },
    "scale": 0.79,
    "height": -0.3,
    "yaw": -79,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598431899-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598431899; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598431899-5",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0074",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.431201,
      "lng": 120.095621
    },
    "scale": 1.02,
    "height": 0.1,
    "yaw": -60,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598431899-5; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598431899; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598431899-6",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0075",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430939,
      "lng": 120.094986
    },
    "scale": 0.84,
    "height": 0.4,
    "yaw": -44,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598431899-6; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598431899; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598431899-7",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0076",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430515,
      "lng": 120.095392
    },
    "scale": 1.06,
    "height": -0.1,
    "yaw": -30,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598431899-7; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598431899; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598431899-8",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0077",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.43089,
      "lng": 120.095756
    },
    "scale": 0.88,
    "height": 0.3,
    "yaw": -19,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598431899-8; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598431899; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598432888-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0078",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430248,
      "lng": 120.094939
    },
    "scale": 1.15,
    "height": -0.1,
    "yaw": 31,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598432888-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598432888; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598432888-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0079",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.43029,
      "lng": 120.094499
    },
    "scale": 0.96,
    "height": 0.2,
    "yaw": 37,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598432888-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598432888; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598432888-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0080",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429995,
      "lng": 120.094615
    },
    "scale": 0.77,
    "height": -0.2,
    "yaw": 39,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598432888-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598432888; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598432888-4",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0081",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.43015,
      "lng": 120.094798
    },
    "scale": 0.98,
    "height": 0.1,
    "yaw": 39,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598432888-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598432888; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598432888-5",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0082",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430555,
      "lng": 120.094544
    },
    "scale": 0.78,
    "height": 0.4,
    "yaw": 37,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598432888-5; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598432888; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598432888-6",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0083",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429951,
      "lng": 120.094281
    },
    "scale": 0.99,
    "height": -0.1,
    "yaw": 32,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598432888-6; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598432888; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598432888-7",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0084",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429878,
      "lng": 120.09497
    },
    "scale": 0.79,
    "height": 0.2,
    "yaw": 24,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598432888-7; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598432888; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598432888-8",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0085",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430412,
      "lng": 120.094927
    },
    "scale": 0.98,
    "height": -0.3,
    "yaw": 13,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598432888-8; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598432888; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598433913-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0086",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.431269,
      "lng": 120.096468
    },
    "scale": 0.83,
    "height": 0.1,
    "yaw": 42,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598433913-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598433913; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598433913-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0087",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430998,
      "lng": 120.096046
    },
    "scale": 1.02,
    "height": 0.3,
    "yaw": 26,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598433913-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598433913; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598433913-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0088",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430806,
      "lng": 120.09645
    },
    "scale": 0.8,
    "height": -0.2,
    "yaw": 7,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598433913-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598433913; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598433913-4",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0089",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.43113,
      "lng": 120.096495
    },
    "scale": 0.99,
    "height": 0.1,
    "yaw": -14,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598433913-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598433913; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598433913-5",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0090",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.431064,
      "lng": 120.096229
    },
    "scale": 0.77,
    "height": 0.3,
    "yaw": -38,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598433913-5; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598433913; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598433913-6",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0091",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430601,
      "lng": 120.096211
    },
    "scale": 0.95,
    "height": -0.2,
    "yaw": -65,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598433913-6; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598433913; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598433913-7",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0092",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430981,
      "lng": 120.096807
    },
    "scale": 1.13,
    "height": 0,
    "yaw": -95,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598433913-7; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598433913; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598433913-8",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0093",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.431372,
      "lng": 120.096306
    },
    "scale": 0.9,
    "height": 0.3,
    "yaw": -127,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598433913-8; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598433913; clusterMode=backgroundGrove; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598442041-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0094",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.42866,
      "lng": 120.096312
    },
    "scale": 1.12,
    "height": -0.2,
    "yaw": -120,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598442041-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598442041; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598442041-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0095",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.428512,
      "lng": 120.096284
    },
    "scale": 0.89,
    "height": 0.1,
    "yaw": -158,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598442041-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598442041; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598442041-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0096",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.428545,
      "lng": 120.096437
    },
    "scale": 1.06,
    "height": 0.3,
    "yaw": 162,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598442041-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598442041; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598443303-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0097",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.428392,
      "lng": 120.09648
    },
    "scale": 0.87,
    "height": -0.2,
    "yaw": 161,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598443303-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598443303; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598443303-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0098",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.428255,
      "lng": 120.096591
    },
    "scale": 1.03,
    "height": 0,
    "yaw": 115,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598443303-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598443303; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598443303-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0099",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.428385,
      "lng": 120.096686
    },
    "scale": 0.79,
    "height": 0.2,
    "yaw": 66,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598443303-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598443303; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598444503-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0100",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429252,
      "lng": 120.098177
    },
    "scale": 0.99,
    "height": -0.2,
    "yaw": 57,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598444503-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598444503; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598444503-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0101",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429217,
      "lng": 120.098386
    },
    "scale": 1.14,
    "height": 0,
    "yaw": 3,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598444503-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598444503; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598444503-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0102",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429381,
      "lng": 120.098345
    },
    "scale": 0.89,
    "height": 0.1,
    "yaw": -54,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598444503-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598444503; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598445412-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0103",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.428936,
      "lng": 120.098356
    },
    "scale": 1.09,
    "height": -0.4,
    "yaw": -72,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598445412-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598445412; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598445412-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0104",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429042,
      "lng": 120.098548
    },
    "scale": 0.83,
    "height": -0.2,
    "yaw": -135,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598445412-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598445412; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598445412-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0105",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.429144,
      "lng": 120.09837
    },
    "scale": 0.97,
    "height": 0,
    "yaw": 160,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598445412-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598445412; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598446324-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0106",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430011,
      "lng": 120.098361
    },
    "scale": 0.76,
    "height": 0.3,
    "yaw": 134,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598446324-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598446324; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598446324-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0107",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430105,
      "lng": 120.098459
    },
    "scale": 0.89,
    "height": -0.4,
    "yaw": 63,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598446324-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598446324; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598446324-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0108",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.430071,
      "lng": 120.098233
    },
    "scale": 1.02,
    "height": -0.2,
    "yaw": -10,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598446324-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598446324; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598448427-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0109",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427642,
      "lng": 120.09711
    },
    "scale": 0.8,
    "height": 0,
    "yaw": -45,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598448427-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598448427; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598448427-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0110",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427622,
      "lng": 120.096927
    },
    "scale": 0.93,
    "height": 0.2,
    "yaw": -123,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598448427-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598448427; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598448427-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0111",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.42757,
      "lng": 120.097148
    },
    "scale": 1.05,
    "height": 0.3,
    "yaw": 155,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598448427-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598448427; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598449254-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0112",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427178,
      "lng": 120.097547
    },
    "scale": 0.82,
    "height": -0.2,
    "yaw": 112,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598449254-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598449254; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598449254-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0113",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427197,
      "lng": 120.097439
    },
    "scale": 0.94,
    "height": -0.1,
    "yaw": 25,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598449254-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598449254; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598449254-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0114",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427142,
      "lng": 120.097623
    },
    "scale": 1.05,
    "height": 0,
    "yaw": -65,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598449254-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598449254; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598450460-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0115",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.42691,
      "lng": 120.097655
    },
    "scale": 0.81,
    "height": 0.2,
    "yaw": -117,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598450460-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598450460; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598450460-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0116",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426849,
      "lng": 120.097535
    },
    "scale": 0.92,
    "height": 0.3,
    "yaw": 148,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598450460-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598450460; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598450460-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0117",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426792,
      "lng": 120.097632
    },
    "scale": 1.03,
    "height": -0.4,
    "yaw": 50,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598450460-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598450460; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598451090-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0118",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426582,
      "lng": 120.097764
    },
    "scale": 0.78,
    "height": -0.2,
    "yaw": -11,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598451090-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598451090; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598451090-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0119",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426448,
      "lng": 120.097721
    },
    "scale": 0.88,
    "height": -0.1,
    "yaw": -114,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598451090-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598451090; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598451090-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0120",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426466,
      "lng": 120.097864
    },
    "scale": 0.98,
    "height": 0,
    "yaw": 139,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598451090-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598451090; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598451787-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0121",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.42606,
      "lng": 120.0977
    },
    "scale": 1.12,
    "height": 0.2,
    "yaw": 71,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598451787-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598451787; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598451787-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0122",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.425923,
      "lng": 120.097787
    },
    "scale": 0.81,
    "height": 0.3,
    "yaw": -41,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598451787-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598451787; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598451787-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0123",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426034,
      "lng": 120.09789
    },
    "scale": 0.9,
    "height": 0.4,
    "yaw": -156,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598451787-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598451787; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598452657-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0124",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.425734,
      "lng": 120.097783
    },
    "scale": 1.03,
    "height": -0.3,
    "yaw": 126,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598452657-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598452657; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598452657-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0125",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.425682,
      "lng": 120.097975
    },
    "scale": 1.12,
    "height": -0.2,
    "yaw": 6,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598452657-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598452657; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598452657-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0126",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.42584,
      "lng": 120.097957
    },
    "scale": 0.8,
    "height": -0.2,
    "yaw": -117,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598452657-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598452657; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598453525-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0127",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.425717,
      "lng": 120.098161
    },
    "scale": 0.92,
    "height": 0,
    "yaw": 157,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598453525-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598453525; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598453525-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0128",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.4258,
      "lng": 120.098357
    },
    "scale": 1,
    "height": 0,
    "yaw": 28,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598453525-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598453525; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598453525-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0129",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.425913,
      "lng": 120.098202
    },
    "scale": 1.07,
    "height": 0.1,
    "yaw": -103,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598453525-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598453525; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598455021-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0130",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427677,
      "lng": 120.099451
    },
    "scale": 0.78,
    "height": 0.2,
    "yaw": 162,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598455021-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598455021; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598455021-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0131",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427866,
      "lng": 120.099528
    },
    "scale": 0.85,
    "height": 0.2,
    "yaw": 25,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598455021-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598455021; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598455021-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0132",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427854,
      "lng": 120.099309
    },
    "scale": 0.91,
    "height": 0.2,
    "yaw": -115,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598455021-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598455021; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598456057-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0133",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427738,
      "lng": 120.099869
    },
    "scale": 1.02,
    "height": 0.3,
    "yaw": 142,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598456057-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598456057; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598456057-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0134",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427877,
      "lng": 120.099863
    },
    "scale": 1.08,
    "height": 0.3,
    "yaw": -4,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598456057-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598456057; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598456057-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0135",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427729,
      "lng": 120.099704
    },
    "scale": 1.13,
    "height": 0.3,
    "yaw": -152,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598456057-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598456057; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598456731-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0136",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427841,
      "lng": 120.100358
    },
    "scale": 0.83,
    "height": -0.4,
    "yaw": 96,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598456731-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598456731; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598456731-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0137",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427862,
      "lng": 120.100272
    },
    "scale": 0.88,
    "height": -0.4,
    "yaw": -58,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598456731-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598456731; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598456731-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0138",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.4278,
      "lng": 120.100434
    },
    "scale": 0.92,
    "height": -0.4,
    "yaw": 145,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598456731-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598456731; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598457464-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0139",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427741,
      "lng": 120.100915
    },
    "scale": 1.01,
    "height": -0.3,
    "yaw": 25,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598457464-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598457464; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598457464-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0140",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427696,
      "lng": 120.100804
    },
    "scale": 1.05,
    "height": -0.4,
    "yaw": -138,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598457464-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598457464; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598457464-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0141",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427642,
      "lng": 120.100879
    },
    "scale": 1.09,
    "height": -0.4,
    "yaw": 57,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598457464-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598457464; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598458229-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0142",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427955,
      "lng": 120.101207
    },
    "scale": 0.77,
    "height": -0.3,
    "yaw": -72,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598458229-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598458229; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598458229-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0143",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427837,
      "lng": 120.101153
    },
    "scale": 0.8,
    "height": -0.4,
    "yaw": 117,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598458229-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598458229; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598458229-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0144",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427841,
      "lng": 120.101281
    },
    "scale": 0.82,
    "height": 0.4,
    "yaw": -57,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598458229-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598458229; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598459040-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0145",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427563,
      "lng": 120.101024
    },
    "scale": 0.89,
    "height": 0.4,
    "yaw": 165,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598459040-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598459040; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598459040-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0146",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427429,
      "lng": 120.101089
    },
    "scale": 0.92,
    "height": 0.3,
    "yaw": -14,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598459040-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598459040; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598459040-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0147",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427521,
      "lng": 120.101196
    },
    "scale": 0.93,
    "height": 0.3,
    "yaw": 163,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598459040-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598459040; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598459923-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0148",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427258,
      "lng": 120.101089
    },
    "scale": 1,
    "height": 0.3,
    "yaw": 17,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598459923-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598459923; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598459923-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0149",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427192,
      "lng": 120.101263
    },
    "scale": 1.01,
    "height": 0.2,
    "yaw": -171,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598459923-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598459923; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598459923-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0150",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.42734,
      "lng": 120.101266
    },
    "scale": 1.02,
    "height": 0.1,
    "yaw": -3,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598459923-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598459923; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598461016-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0151",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427598,
      "lng": 120.100478
    },
    "scale": 1.07,
    "height": 0.1,
    "yaw": -157,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598461016-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598461016; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598461016-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0152",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427659,
      "lng": 120.100673
    },
    "scale": 1.08,
    "height": 0,
    "yaw": 6,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598461016-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598461016; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598461016-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0153",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427779,
      "lng": 120.100542
    },
    "scale": 1.08,
    "height": -0.1,
    "yaw": 166,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598461016-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598461016; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598461986-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0154",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427543,
      "lng": 120.1002
    },
    "scale": 1.12,
    "height": -0.1,
    "yaw": 2,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598461986-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598461986; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598461986-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0155",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427715,
      "lng": 120.100297
    },
    "scale": 1.11,
    "height": -0.3,
    "yaw": 157,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598461986-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598461986; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598461986-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0156",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427725,
      "lng": 120.100088
    },
    "scale": 1.11,
    "height": -0.4,
    "yaw": -51,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598461986-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598461986; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598462947-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0157",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427423,
      "lng": 120.099797
    },
    "scale": 1.14,
    "height": 0.4,
    "yaw": 136,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598462947-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598462947; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598462947-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0158",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427617,
      "lng": 120.099722
    },
    "scale": 1.13,
    "height": 0.2,
    "yaw": -78,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598462947-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598462947; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598462947-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0159",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.427492,
      "lng": 120.099552
    },
    "scale": 1.11,
    "height": 0.1,
    "yaw": 65,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598462947-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598462947; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598471433-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0160",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426443,
      "lng": 120.098497
    },
    "scale": 1.14,
    "height": 0,
    "yaw": -116,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598471433-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598471433; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598471433-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0161",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426347,
      "lng": 120.098357
    },
    "scale": 1.11,
    "height": -0.1,
    "yaw": 21,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598471433-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598471433; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598471433-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0162",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426395,
      "lng": 120.098574
    },
    "scale": 1.09,
    "height": -0.3,
    "yaw": 156,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598471433-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598471433; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598473437-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0163",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426909,
      "lng": 120.099418
    },
    "scale": 1.1,
    "height": -0.4,
    "yaw": -34,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598473437-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598473437; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598473437-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0164",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426879,
      "lng": 120.099321
    },
    "scale": 1.07,
    "height": 0.3,
    "yaw": 94,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598473437-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598473437; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598473437-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0165",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.42691,
      "lng": 120.099506
    },
    "scale": 1.03,
    "height": 0.1,
    "yaw": -140,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598473437-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598473437; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598474440-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0166",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426636,
      "lng": 120.099565
    },
    "scale": 1.04,
    "height": 0,
    "yaw": 21,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598474440-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598474440; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598474440-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0167",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426536,
      "lng": 120.099504
    },
    "scale": 1,
    "height": -0.2,
    "yaw": 141,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598474440-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598474440; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598474440-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0168",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.42653,
      "lng": 120.099614
    },
    "scale": 0.96,
    "height": 0.4,
    "yaw": -102,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598474440-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598474440; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598475313-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0169",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.42656,
      "lng": 120.099117
    },
    "scale": 0.95,
    "height": 0.3,
    "yaw": 51,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598475313-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598475313; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598475313-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0170",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426431,
      "lng": 120.099161
    },
    "scale": 0.9,
    "height": 0.1,
    "yaw": 162,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598475313-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598475313; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598475313-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0171",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426505,
      "lng": 120.099268
    },
    "scale": 0.85,
    "height": -0.1,
    "yaw": -90,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598475313-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598475313; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598476186-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0172",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426353,
      "lng": 120.099242
    },
    "scale": 0.84,
    "height": -0.3,
    "yaw": 54,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598476186-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598476186; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598476186-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0173",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426277,
      "lng": 120.099397
    },
    "scale": 0.78,
    "height": 0.3,
    "yaw": 156,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598476186-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598476186; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598476186-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0174",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426413,
      "lng": 120.099417
    },
    "scale": 1.12,
    "height": 0.1,
    "yaw": -104,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598476186-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598476186; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598477220-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0175",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.42631,
      "lng": 120.098796
    },
    "scale": 1.1,
    "height": -0.1,
    "yaw": 30,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598477220-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598477220; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598477220-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0176",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426351,
      "lng": 120.098987
    },
    "scale": 1.03,
    "height": -0.3,
    "yaw": 124,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598477220-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598477220; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598477220-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0177",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426475,
      "lng": 120.09888
    },
    "scale": 0.96,
    "height": 0.2,
    "yaw": -145,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598477220-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598477220; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598478036-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0178",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426083,
      "lng": 120.098966
    },
    "scale": 0.93,
    "height": 0,
    "yaw": -19,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598478036-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598478036; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598478036-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0179",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426237,
      "lng": 120.099079
    },
    "scale": 0.85,
    "height": -0.2,
    "yaw": 65,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598478036-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598478036; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598478036-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0180",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426266,
      "lng": 120.098884
    },
    "scale": 0.77,
    "height": 0.3,
    "yaw": 148,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598478036-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598478036; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598478937-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0181",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.425977,
      "lng": 120.098706
    },
    "scale": 1.13,
    "height": 0.1,
    "yaw": -96,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598478937-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598478937; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598478937-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0182",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426169,
      "lng": 120.098658
    },
    "scale": 1.04,
    "height": -0.2,
    "yaw": -20,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598478937-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598478937; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598478937-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0183",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426066,
      "lng": 120.09848
    },
    "scale": 0.95,
    "height": 0.3,
    "yaw": 54,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598478937-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598478937; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598480722-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0184",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.425856,
      "lng": 120.0988
    },
    "scale": 0.9,
    "height": 0.1,
    "yaw": 161,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598480722-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598480722; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598480722-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0185",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.42597,
      "lng": 120.098722
    },
    "scale": 0.81,
    "height": -0.2,
    "yaw": -131,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598480722-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598480722; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598480722-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0186",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.425778,
      "lng": 120.098674
    },
    "scale": 1.11,
    "height": 0.3,
    "yaw": -67,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598480722-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598480722; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598481435-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0187",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.425773,
      "lng": 120.098899
    },
    "scale": 1.05,
    "height": 0.1,
    "yaw": 32,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598481435-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598481435; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598481435-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0188",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.425616,
      "lng": 120.098849
    },
    "scale": 0.94,
    "height": -0.3,
    "yaw": 91,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598481435-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598481435; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598481435-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0189",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.425769,
      "lng": 120.098992
    },
    "scale": 0.84,
    "height": 0.2,
    "yaw": 146,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598481435-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598481435; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598482292-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0190",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426011,
      "lng": 120.099211
    },
    "scale": 0.77,
    "height": 0,
    "yaw": -124,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598482292-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598482292; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598482292-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0191",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.425929,
      "lng": 120.099148
    },
    "scale": 1.05,
    "height": -0.4,
    "yaw": -74,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598482292-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598482292; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598482292-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0192",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.425919,
      "lng": 120.099236
    },
    "scale": 0.94,
    "height": 0.1,
    "yaw": -28,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598482292-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598482292; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598483002-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0193",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426143,
      "lng": 120.099472
    },
    "scale": 0.86,
    "height": -0.2,
    "yaw": 53,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598483002-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598483002; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598483002-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0194",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426023,
      "lng": 120.099497
    },
    "scale": 1.13,
    "height": 0.2,
    "yaw": 94,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598483002-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598483002; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598483002-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0195",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.42608,
      "lng": 120.099598
    },
    "scale": 1.01,
    "height": -0.1,
    "yaw": 132,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598483002-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598483002; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598497651-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0196",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426231,
      "lng": 120.099769
    },
    "scale": 0.92,
    "height": 0.4,
    "yaw": -156,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598497651-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598497651; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598497651-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0197",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426148,
      "lng": 120.099902
    },
    "scale": 0.79,
    "height": 0,
    "yaw": -125,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598497651-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598497651; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598497651-3",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0198",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426269,
      "lng": 120.099937
    },
    "scale": 1.05,
    "height": -0.4,
    "yaw": -96,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598497651-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598497651; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598498754-1",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0199",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426415,
      "lng": 120.099672
    },
    "scale": 0.96,
    "height": 0.1,
    "yaw": -33,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598498754-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598498754; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598498754-2",
    "zoneId": "manual-tier-1",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0200",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426436,
      "lng": 120.099855
    },
    "scale": 0.81,
    "height": -0.3,
    "yaw": -10,
    "opacity": 0.92,
    "visible": true,
    "priority": "high",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598498754-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598498754; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=1."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598498754-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0201",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.42656,
      "lng": 120.099772
    },
    "scale": 1.07,
    "height": 0.1,
    "yaw": 10,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598498754-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598498754; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=2."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598500608-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0202",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426187,
      "lng": 120.097893
    },
    "scale": 0.96,
    "height": -0.2,
    "yaw": 64,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598500608-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598500608; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=2."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598500608-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0203",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426323,
      "lng": 120.098019
    },
    "scale": 0.81,
    "height": 0.2,
    "yaw": 78,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598500608-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598500608; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=2."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598500608-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0204",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426369,
      "lng": 120.09784
    },
    "scale": 1.06,
    "height": -0.3,
    "yaw": 89,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598500608-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598500608; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598506622-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0205",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.426006,
      "lng": 120.098099
    },
    "scale": 87.55,
    "height": 2.3,
    "yaw": 133,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598506622-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598506622; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598506622-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0206",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.426139,
      "lng": 120.098083
    },
    "scale": 79.47,
    "height": 1.9,
    "yaw": 138,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598506622-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598506622; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598506622-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0207",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.426082,
      "lng": 120.097954
    },
    "scale": 91.23,
    "height": 2.2,
    "yaw": 141,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598506622-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598506622; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598506622-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0208",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.426004,
      "lng": 120.098051
    },
    "scale": 82.83,
    "height": 1.8,
    "yaw": 140,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598506622-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598506622; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598508917-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0209",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.42601,
      "lng": 120.097809
    },
    "scale": 96.48,
    "height": 2.2,
    "yaw": 172,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598508917-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598508917; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598508917-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0210",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.426103,
      "lng": 120.097681
    },
    "scale": 87.77,
    "height": 1.7,
    "yaw": 165,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598508917-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598508917; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598508917-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0211",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425976,
      "lng": 120.097631
    },
    "scale": 78.91,
    "height": 2.1,
    "yaw": 155,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598508917-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598508917; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598508917-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0212",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425977,
      "lng": 120.097777
    },
    "scale": 89.88,
    "height": 2.4,
    "yaw": 142,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598508917-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598508917; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598510467-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0213",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.427614,
      "lng": 120.099816
    },
    "scale": 82.9,
    "height": 2,
    "yaw": 163,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598510467-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598510467; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598510467-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0214",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.427645,
      "lng": 120.099703
    },
    "scale": 93.56,
    "height": 2.3,
    "yaw": 144,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598510467-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598510467; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598510467-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0215",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.427515,
      "lng": 120.099775
    },
    "scale": 84.06,
    "height": 1.8,
    "yaw": 122,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598510467-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598510467; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598510467-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0216",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.427609,
      "lng": 120.099887
    },
    "scale": 94.41,
    "height": 2.1,
    "yaw": 97,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598510467-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598510467; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598511131-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0217",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.427723,
      "lng": 120.100097
    },
    "scale": 86.78,
    "height": 2.5,
    "yaw": 105,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598511131-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598511131; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598511131-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0218",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.427677,
      "lng": 120.100056
    },
    "scale": 96.81,
    "height": 2,
    "yaw": 74,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598511131-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598511131; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598511131-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0219",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.427675,
      "lng": 120.100097
    },
    "scale": 86.68,
    "height": 2.3,
    "yaw": 40,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598511131-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598511131; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598511131-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0220",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.427751,
      "lng": 120.100153
    },
    "scale": 96.4,
    "height": 1.7,
    "yaw": 3,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598511131-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598511131; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598512253-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0221",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.427804,
      "lng": 120.099594
    },
    "scale": 88.12,
    "height": 2.1,
    "yaw": -1,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598512253-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598512253; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598512253-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0222",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.427727,
      "lng": 120.0996
    },
    "scale": 97.52,
    "height": 2.3,
    "yaw": -44,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598512253-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598512253; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598512253-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0223",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.427756,
      "lng": 120.099664
    },
    "scale": 86.76,
    "height": 1.8,
    "yaw": -90,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598512253-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598512253; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598512253-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0224",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.427779,
      "lng": 120.099625
    },
    "scale": 95.84,
    "height": 2.1,
    "yaw": -139,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598512253-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598512253; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598515256-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0225",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.426038,
      "lng": 120.098562
    },
    "scale": 86.92,
    "height": 2.4,
    "yaw": -155,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598515256-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598515256; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598515256-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0226",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425976,
      "lng": 120.098642
    },
    "scale": 95.68,
    "height": 1.8,
    "yaw": 149,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598515256-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598515256; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598515256-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0227",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.426051,
      "lng": 120.098674
    },
    "scale": 84.29,
    "height": 2,
    "yaw": 91,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598515256-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598515256; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598515256-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0228",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.42605,
      "lng": 120.098598
    },
    "scale": 92.73,
    "height": 2.3,
    "yaw": 30,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598515256-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598515256; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598516339-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0229",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.426269,
      "lng": 120.099794
    },
    "scale": 83.17,
    "height": 1.8,
    "yaw": 1,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598516339-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598516339; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598516339-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0230",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.426271,
      "lng": 120.099918
    },
    "scale": 91.29,
    "height": 2,
    "yaw": -66,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598516339-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598516339; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598516339-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0231",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.426358,
      "lng": 120.099874
    },
    "scale": 79.25,
    "height": 2.2,
    "yaw": -136,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598516339-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598516339; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598516339-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0232",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.426302,
      "lng": 120.099805
    },
    "scale": 87.06,
    "height": 2.4,
    "yaw": 151,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598516339-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598516339; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598517339-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0233",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.426553,
      "lng": 120.099588
    },
    "scale": 96.84,
    "height": 1.8,
    "yaw": 109,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598517339-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598517339; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598517339-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0234",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.426636,
      "lng": 120.099684
    },
    "scale": 84.33,
    "height": 2,
    "yaw": 30,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598517339-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598517339; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598517339-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0235",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.426678,
      "lng": 120.09957
    },
    "scale": 91.65,
    "height": 2.2,
    "yaw": -52,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598517339-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598517339; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598517339-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0236",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.426583,
      "lng": 120.099562
    },
    "scale": 78.82,
    "height": 2.4,
    "yaw": -138,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598517339-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598517339; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598519194-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0237",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425616,
      "lng": 120.09809
    },
    "scale": 87.95,
    "height": 1.8,
    "yaw": 168,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598519194-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598519194; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598519194-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0238",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425743,
      "lng": 120.098092
    },
    "scale": 94.79,
    "height": 2,
    "yaw": 77,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598519194-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598519194; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598519194-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0239",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425702,
      "lng": 120.097963
    },
    "scale": 81.47,
    "height": 2.1,
    "yaw": -18,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598519194-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598519194; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598519194-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0240",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.42562,
      "lng": 120.098043
    },
    "scale": 88,
    "height": 2.3,
    "yaw": -115,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598519194-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598519194; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598520319-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0241",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425644,
      "lng": 120.096148
    },
    "scale": 96.48,
    "height": 2.5,
    "yaw": 179,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598520319-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598520319; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598520319-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0242",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425744,
      "lng": 120.096038
    },
    "scale": 82.67,
    "height": 1.8,
    "yaw": 75,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598520319-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598520319; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598520319-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0243",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425628,
      "lng": 120.095974
    },
    "scale": 88.71,
    "height": 1.9,
    "yaw": -32,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598520319-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598520319; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598520319-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0244",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425615,
      "lng": 120.096111
    },
    "scale": 94.59,
    "height": 2.1,
    "yaw": -142,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598520319-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598520319; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598521086-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0245",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425529,
      "lng": 120.095808
    },
    "scale": 82.41,
    "height": 2.3,
    "yaw": 139,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598521086-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598521086; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598521086-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0246",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425578,
      "lng": 120.095722
    },
    "scale": 87.96,
    "height": 2.4,
    "yaw": 23,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598521086-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598521086; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598521086-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0247",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425448,
      "lng": 120.095773
    },
    "scale": 93.35,
    "height": 2.5,
    "yaw": -96,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598521086-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598521086; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598521086-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0248",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425525,
      "lng": 120.095892
    },
    "scale": 78.58,
    "height": 1.7,
    "yaw": 142,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598521086-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598521086; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598521801-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0249",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425496,
      "lng": 120.096431
    },
    "scale": 85.75,
    "height": 1.9,
    "yaw": 51,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598521801-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598521801; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598521801-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0250",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425464,
      "lng": 120.096401
    },
    "scale": 90.65,
    "height": 2,
    "yaw": -78,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598521801-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598521801; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598521801-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0251",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425388,
      "lng": 120.096467
    },
    "scale": 95.4,
    "height": 2.1,
    "yaw": 151,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598521801-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598521801; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598521801-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0252",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425523,
      "lng": 120.096491
    },
    "scale": 79.98,
    "height": 2.1,
    "yaw": 17,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598521801-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598521801; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598522811-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0253",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425415,
      "lng": 120.095191
    },
    "scale": 86.48,
    "height": 2.3,
    "yaw": -87,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598522811-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598522811; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598522811-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0254",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.42535,
      "lng": 120.09519
    },
    "scale": 90.73,
    "height": 2.3,
    "yaw": 132,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598522811-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598522811; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598522811-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0255",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.42537,
      "lng": 120.09524
    },
    "scale": 94.83,
    "height": 2.4,
    "yaw": -12,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598522811-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598522811; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598522811-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0256",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425465,
      "lng": 120.09522
    },
    "scale": 78.76,
    "height": 2.4,
    "yaw": -159,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598522811-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598522811; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598523789-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0257",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424177,
      "lng": 120.095038
    },
    "scale": 84.6,
    "height": 1.7,
    "yaw": 85,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598523789-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598523789; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598523789-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0258",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424115,
      "lng": 120.095103
    },
    "scale": 88.2,
    "height": 1.7,
    "yaw": -68,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598523789-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598523789; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598523789-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0259",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424177,
      "lng": 120.095138
    },
    "scale": 91.64,
    "height": 1.8,
    "yaw": 136,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598523789-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598523789; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598523789-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0260",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424179,
      "lng": 120.095079
    },
    "scale": 94.91,
    "height": 1.8,
    "yaw": -23,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598523789-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598523789; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598525274-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0261",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423856,
      "lng": 120.097405
    },
    "scale": 80.09,
    "height": 1.9,
    "yaw": -152,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598525274-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598525274; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598525274-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0262",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423848,
      "lng": 120.097518
    },
    "scale": 83.04,
    "height": 1.9,
    "yaw": 42,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598525274-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598525274; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598525274-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0263",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423929,
      "lng": 120.09749
    },
    "scale": 85.82,
    "height": 1.9,
    "yaw": -126,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598525274-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598525274; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598525274-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0264",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423887,
      "lng": 120.097423
    },
    "scale": 88.45,
    "height": 1.8,
    "yaw": 62,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598525274-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598525274; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598526073-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0265",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424162,
      "lng": 120.097838
    },
    "scale": 92.96,
    "height": 1.9,
    "yaw": -79,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598526073-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598526073; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598526073-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0266",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424231,
      "lng": 120.097938
    },
    "scale": 95.25,
    "height": 1.9,
    "yaw": 103,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598526073-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598526073; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598526073-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0267",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.42428,
      "lng": 120.097838
    },
    "scale": 97.37,
    "height": 1.8,
    "yaw": -78,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598526073-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598526073; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598526073-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0268",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424195,
      "lng": 120.097819
    },
    "scale": 79.34,
    "height": 1.8,
    "yaw": 98,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598526073-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598526073; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598527040-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0269",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424327,
      "lng": 120.097814
    },
    "scale": 83.18,
    "height": 1.8,
    "yaw": -57,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598527040-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598527040; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598527040-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0270",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424447,
      "lng": 120.097832
    },
    "scale": 84.81,
    "height": 1.8,
    "yaw": 113,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598527040-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598527040; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598527040-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0271",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.42442,
      "lng": 120.097706
    },
    "scale": 86.28,
    "height": 1.7,
    "yaw": -81,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598527040-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598527040; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598527040-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0272",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424337,
      "lng": 120.097769
    },
    "scale": 87.59,
    "height": 2.4,
    "yaw": 83,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598527040-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598527040; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598528007-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0273",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425375,
      "lng": 120.099435
    },
    "scale": 90.76,
    "height": 2.4,
    "yaw": -84,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598528007-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598528007; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598528007-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0274",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.42548,
      "lng": 120.099343
    },
    "scale": 91.73,
    "height": 2.4,
    "yaw": 73,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598528007-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598528007; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598528007-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0275",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425377,
      "lng": 120.099268
    },
    "scale": 92.54,
    "height": 2.3,
    "yaw": -133,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598528007-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598528007; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598528007-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0276",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425351,
      "lng": 120.099394
    },
    "scale": 93.18,
    "height": 2.2,
    "yaw": 18,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598528007-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598528007; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598528645-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0277",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425406,
      "lng": 120.099193
    },
    "scale": 95.68,
    "height": 2.2,
    "yaw": -162,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598528645-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598528645; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598528645-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0278",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425429,
      "lng": 120.099031
    },
    "scale": 95.99,
    "height": 2.1,
    "yaw": -17,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598528645-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598528645; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598528645-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0279",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.4253,
      "lng": 120.099062
    },
    "scale": 96.14,
    "height": 1.9,
    "yaw": 124,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598528645-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598528645; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598528645-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0280",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425361,
      "lng": 120.099184
    },
    "scale": 96.12,
    "height": 1.8,
    "yaw": -97,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598528645-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598528645; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598529409-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0281",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424822,
      "lng": 120.099127
    },
    "scale": 97.94,
    "height": 1.8,
    "yaw": 70,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598529409-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598529409; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598529409-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0282",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424804,
      "lng": 120.099015
    },
    "scale": 97.59,
    "height": 2.4,
    "yaw": -158,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598529409-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598529409; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598529409-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0283",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424725,
      "lng": 120.099151
    },
    "scale": 97.07,
    "height": 2.3,
    "yaw": -29,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598529409-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598529409; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598529409-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0284",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424851,
      "lng": 120.099192
    },
    "scale": 96.38,
    "height": 2.1,
    "yaw": 97,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598529409-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598529409; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598530275-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0285",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423931,
      "lng": 120.098563
    },
    "scale": 97.53,
    "height": 2.1,
    "yaw": -108,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598530275-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598530275; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598530275-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0286",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423879,
      "lng": 120.098558
    },
    "scale": 96.51,
    "height": 1.9,
    "yaw": 11,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598530275-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598530275; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598530275-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0287",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423857,
      "lng": 120.098672
    },
    "scale": 95.32,
    "height": 1.7,
    "yaw": 127,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598530275-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598530275; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598530275-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0288",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.42398,
      "lng": 120.098596
    },
    "scale": 93.97,
    "height": 2.4,
    "yaw": -120,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598530275-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598530275; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598531088-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0289",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423876,
      "lng": 120.098951
    },
    "scale": 94.44,
    "height": 2.3,
    "yaw": 22,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598531088-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598531088; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598531088-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0290",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423817,
      "lng": 120.099001
    },
    "scale": 92.75,
    "height": 2.1,
    "yaw": 129,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598531088-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598531088; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598531088-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0291",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423866,
      "lng": 120.099034
    },
    "scale": 90.89,
    "height": 1.9,
    "yaw": -127,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598531088-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598531088; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598531088-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0292",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423858,
      "lng": 120.099001
    },
    "scale": 88.87,
    "height": 2.5,
    "yaw": -27,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598531088-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598531088; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598532098-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0293",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423781,
      "lng": 120.099911
    },
    "scale": 88.66,
    "height": 2.3,
    "yaw": 102,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598532098-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598532098; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598532098-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0294",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423764,
      "lng": 120.100013
    },
    "scale": 86.3,
    "height": 2.1,
    "yaw": -164,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598532098-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598532098; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598532098-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0295",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423838,
      "lng": 120.099996
    },
    "scale": 83.77,
    "height": 1.9,
    "yaw": -73,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598532098-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598532098; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598532098-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0296",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423807,
      "lng": 120.099938
    },
    "scale": 81.08,
    "height": 2.5,
    "yaw": 15,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598532098-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598532098; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598532861-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0297",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.42418,
      "lng": 120.100955
    },
    "scale": 80.18,
    "height": 2.3,
    "yaw": 131,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598532861-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598532861; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598532861-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0298",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424234,
      "lng": 120.101056
    },
    "scale": 97.15,
    "height": 2.1,
    "yaw": -148,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598532861-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598532861; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598532861-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0299",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424288,
      "lng": 120.10097
    },
    "scale": 93.95,
    "height": 1.8,
    "yaw": -69,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598532861-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598532861; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598532861-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0300",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424215,
      "lng": 120.100944
    },
    "scale": 90.59,
    "height": 2.4,
    "yaw": 6,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598532861-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598532861; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598533509-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0301",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424782,
      "lng": 120.101648
    },
    "scale": 89.01,
    "height": 2.2,
    "yaw": 109,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598533509-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598533509; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598533509-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0302",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424892,
      "lng": 120.10168
    },
    "scale": 85.3,
    "height": 1.9,
    "yaw": 178,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598533509-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598533509; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598533509-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0303",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424879,
      "lng": 120.10156
    },
    "scale": 81.43,
    "height": 2.4,
    "yaw": -117,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598533509-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598533509; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598533509-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0304",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424798,
      "lng": 120.101607
    },
    "scale": 97.39,
    "height": 2.1,
    "yaw": -54,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598533509-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598533509; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598534477-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0305",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425449,
      "lng": 120.101728
    },
    "scale": 95.12,
    "height": 1.9,
    "yaw": 36,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598534477-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598534477; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598534477-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0306",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425557,
      "lng": 120.101655
    },
    "scale": 90.74,
    "height": 2.4,
    "yaw": 92,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598534477-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598534477; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598534477-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0307",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425468,
      "lng": 120.10157
    },
    "scale": 86.19,
    "height": 2.1,
    "yaw": 144,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598534477-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598534477; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598534477-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0308",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425431,
      "lng": 120.101683
    },
    "scale": 81.47,
    "height": 1.8,
    "yaw": -166,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598534477-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598534477; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598535627-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0309",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425753,
      "lng": 120.101489
    },
    "scale": 78.51,
    "height": 2.4,
    "yaw": -89,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598535627-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598535627; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598535627-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0310",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425789,
      "lng": 120.101338
    },
    "scale": 93.46,
    "height": 2,
    "yaw": -46,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598535627-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598535627; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598535627-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0311",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425665,
      "lng": 120.10135
    },
    "scale": 88.23,
    "height": 1.7,
    "yaw": -6,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598535627-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598535627; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598535627-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0312",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.42571,
      "lng": 120.101473
    },
    "scale": 82.83,
    "height": 2.2,
    "yaw": 31,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598535627-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598535627; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598536290-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0313",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425839,
      "lng": 120.100819
    },
    "scale": 79.18,
    "height": 1.9,
    "yaw": 95,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598536290-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598536290; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598536290-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0314",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425771,
      "lng": 120.10067
    },
    "scale": 93.44,
    "height": 2.3,
    "yaw": 126,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598536290-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598536290; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598536290-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0315",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425683,
      "lng": 120.100789
    },
    "scale": 87.54,
    "height": 2,
    "yaw": 153,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598536290-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598536290; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598536290-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0316",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425797,
      "lng": 120.100846
    },
    "scale": 81.46,
    "height": 2.4,
    "yaw": 177,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598536290-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598536290; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598537626-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0317",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.427252,
      "lng": 120.101534
    },
    "scale": 97.12,
    "height": 2.1,
    "yaw": -132,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598537626-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598537626; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598537626-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0318",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.427222,
      "lng": 120.101536
    },
    "scale": 90.7,
    "height": 1.7,
    "yaw": -115,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598537626-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598537626; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598537626-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0319",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.427178,
      "lng": 120.101627
    },
    "scale": 84.11,
    "height": 2.1,
    "yaw": -100,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598537626-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598537626; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598537626-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0320",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.427303,
      "lng": 120.101571
    },
    "scale": 97.35,
    "height": 1.8,
    "yaw": -89,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598537626-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598537626; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598538444-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0321",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.426503,
      "lng": 120.100491
    },
    "scale": 92.31,
    "height": 2.2,
    "yaw": -51,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598538444-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598538444; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598538444-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0322",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.426451,
      "lng": 120.100527
    },
    "scale": 85.21,
    "height": 1.8,
    "yaw": -47,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598538444-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598538444; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598538444-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0323",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.426485,
      "lng": 120.10055
    },
    "scale": 97.93,
    "height": 2.2,
    "yaw": -45,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598538444-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598538444; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598538444-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0324",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.426559,
      "lng": 120.100487
    },
    "scale": 90.49,
    "height": 1.8,
    "yaw": -47,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598538444-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598538444; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598539762-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0325",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423175,
      "lng": 120.100059
    },
    "scale": 84.76,
    "height": 2.2,
    "yaw": -22,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598539762-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598539762; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598539762-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0326",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423151,
      "lng": 120.100147
    },
    "scale": 96.97,
    "height": 1.8,
    "yaw": -30,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598539762-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598539762; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598539762-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0327",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423215,
      "lng": 120.10014
    },
    "scale": 89.01,
    "height": 2.1,
    "yaw": -42,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598539762-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598539762; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598539762-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0328",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423193,
      "lng": 120.100097
    },
    "scale": 80.88,
    "height": 2.5,
    "yaw": -57,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598539762-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598539762; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598540405-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0329",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.422841,
      "lng": 120.100573
    },
    "scale": 94.45,
    "height": 2.1,
    "yaw": -45,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598540405-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598540405; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598540405-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0330",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.422882,
      "lng": 120.100672
    },
    "scale": 85.97,
    "height": 2.4,
    "yaw": -66,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598540405-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598540405; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598540405-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0331",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.422937,
      "lng": 120.100602
    },
    "scale": 97.32,
    "height": 2,
    "yaw": -91,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598540405-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598540405; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598540405-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0332",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.422877,
      "lng": 120.100572
    },
    "scale": 88.5,
    "height": 2.3,
    "yaw": -118,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598540405-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598540405; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598541226-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0333",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423209,
      "lng": 120.100854
    },
    "scale": 81.37,
    "height": 1.9,
    "yaw": -120,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598541226-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598541226; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598541226-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0334",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423309,
      "lng": 120.100897
    },
    "scale": 92.21,
    "height": 2.2,
    "yaw": -154,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598541226-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598541226; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598541226-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0335",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423308,
      "lng": 120.100786
    },
    "scale": 82.87,
    "height": 2.5,
    "yaw": 168,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598541226-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598541226; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598541226-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0336",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423231,
      "lng": 120.100817
    },
    "scale": 93.36,
    "height": 2,
    "yaw": 128,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598541226-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598541226; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598541997-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0337",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423477,
      "lng": 120.101722
    },
    "scale": 85.53,
    "height": 2.3,
    "yaw": 113,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598541997-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598541997; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598541997-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0338",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423585,
      "lng": 120.101667
    },
    "scale": 95.67,
    "height": 1.8,
    "yaw": 66,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598541997-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598541997; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598541997-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0339",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423511,
      "lng": 120.101577
    },
    "scale": 85.64,
    "height": 2.1,
    "yaw": 16,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598541997-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598541997; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598541997-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0340",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423466,
      "lng": 120.101676
    },
    "scale": 95.44,
    "height": 2.4,
    "yaw": -38,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598541997-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598541997; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598542744-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0341",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424003,
      "lng": 120.102653
    },
    "scale": 86.9,
    "height": 1.9,
    "yaw": -66,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598542744-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598542744; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598542744-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0342",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424052,
      "lng": 120.102514
    },
    "scale": 96.36,
    "height": 2.1,
    "yaw": -126,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598542744-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598542744; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598542744-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0343",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423934,
      "lng": 120.102509
    },
    "scale": 85.63,
    "height": 2.4,
    "yaw": 170,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598542744-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598542744; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598542744-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0344",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.423963,
      "lng": 120.10263
    },
    "scale": 94.74,
    "height": 1.8,
    "yaw": 103,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598542744-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598542744; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598543692-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0345",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424228,
      "lng": 120.102044
    },
    "scale": 85.5,
    "height": 2.1,
    "yaw": 62,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598543692-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598543692; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598543692-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0346",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424177,
      "lng": 120.101894
    },
    "scale": 94.25,
    "height": 2.4,
    "yaw": -11,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598543692-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598543692; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598543692-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0347",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424082,
      "lng": 120.101994
    },
    "scale": 82.83,
    "height": 1.8,
    "yaw": -87,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598543692-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598543692; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598543692-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0348",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.424183,
      "lng": 120.102063
    },
    "scale": 91.24,
    "height": 2,
    "yaw": -167,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598543692-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598543692; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598560150-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0349",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.429407,
      "lng": 120.103471
    },
    "scale": 81.29,
    "height": 2.3,
    "yaw": 138,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598560150-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598560150; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598560150-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0350",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.42935,
      "lng": 120.103385
    },
    "scale": 89.35,
    "height": 2.5,
    "yaw": 52,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598560150-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598560150; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598560150-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0351",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.42934,
      "lng": 120.103546
    },
    "scale": 97.24,
    "height": 1.8,
    "yaw": -38,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598560150-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598560150; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598560150-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0352",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.429464,
      "lng": 120.103511
    },
    "scale": 84.95,
    "height": 2,
    "yaw": -131,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598560150-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598560150; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598561191-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0353",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.429468,
      "lng": 120.104314
    },
    "scale": 94.29,
    "height": 2.3,
    "yaw": 162,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598561191-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598561191; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598561191-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0354",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.429429,
      "lng": 120.104339
    },
    "scale": 81.65,
    "height": 2.4,
    "yaw": 62,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598561191-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598561191; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598561191-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0355",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.429453,
      "lng": 120.104448
    },
    "scale": 88.84,
    "height": 1.8,
    "yaw": -41,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598561191-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598561191; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598561191-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0356",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.429526,
      "lng": 120.104313
    },
    "scale": 95.85,
    "height": 2,
    "yaw": -147,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598561191-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598561191; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598561888-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0357",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.429077,
      "lng": 120.103828
    },
    "scale": 84.48,
    "height": 2.2,
    "yaw": 132,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598561888-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598561888; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598561888-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0358",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.429051,
      "lng": 120.103902
    },
    "scale": 91.14,
    "height": 2.3,
    "yaw": 20,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598561888-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598561888; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598561888-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0359",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.4291,
      "lng": 120.1039
    },
    "scale": 97.63,
    "height": 2.4,
    "yaw": -96,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598561888-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598561888; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598561888-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0360",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.429123,
      "lng": 120.103789
    },
    "scale": 83.94,
    "height": 1.8,
    "yaw": 144,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598561888-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598561888; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598562881-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0361",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.427801,
      "lng": 120.104066
    },
    "scale": 91.86,
    "height": 1.9,
    "yaw": 50,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598562881-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598562881; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598562881-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0362",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.42783,
      "lng": 120.104159
    },
    "scale": 97.82,
    "height": 2.1,
    "yaw": -76,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598562881-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598562881; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598562881-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0363",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.427883,
      "lng": 120.104105
    },
    "scale": 83.6,
    "height": 2.2,
    "yaw": 155,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598562881-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598562881; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598562881-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0364",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.427836,
      "lng": 120.104077
    },
    "scale": 89.21,
    "height": 2.3,
    "yaw": 23,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598562881-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598562881; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598563642-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0365",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.427313,
      "lng": 120.104447
    },
    "scale": 96.41,
    "height": 2.4,
    "yaw": -85,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598563642-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598563642; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598563642-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0366",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.427401,
      "lng": 120.104499
    },
    "scale": 81.67,
    "height": 1.7,
    "yaw": 136,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598563642-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598563642; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598563642-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0367",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.42741,
      "lng": 120.104399
    },
    "scale": 86.75,
    "height": 1.8,
    "yaw": -6,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598563642-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598563642; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598563642-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0368",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.42734,
      "lng": 120.104418
    },
    "scale": 91.65,
    "height": 1.8,
    "yaw": -152,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598563642-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598563642; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598564677-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0369",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.42591,
      "lng": 120.10527
    },
    "scale": 78.14,
    "height": 2,
    "yaw": 87,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598564677-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598564677; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598564677-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0370",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.426016,
      "lng": 120.105232
    },
    "scale": 82.69,
    "height": 2,
    "yaw": -66,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598564677-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598564677; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598564677-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0371",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425956,
      "lng": 120.105139
    },
    "scale": 87.06,
    "height": 2.1,
    "yaw": 139,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598564677-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598564677; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598564677-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0372",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.425906,
      "lng": 120.105223
    },
    "scale": 91.26,
    "height": 2.1,
    "yaw": -20,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598564677-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598564677; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598572336-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0373",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.429743,
      "lng": 120.102249
    },
    "scale": 97.03,
    "height": 2.2,
    "yaw": -155,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598572336-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598572336; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598572336-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0374",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.429802,
      "lng": 120.102124
    },
    "scale": 80.87,
    "height": 2.2,
    "yaw": 40,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598572336-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598572336; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598572336-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0375",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.429692,
      "lng": 120.102104
    },
    "scale": 84.54,
    "height": 2.3,
    "yaw": -129,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598572336-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598572336; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_round_tree-1781598572336-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_round_tree",
    "name": "手动树群 0376",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-a.glb",
    "location": {
      "lat": 31.429707,
      "lng": 120.102219
    },
    "scale": 88.03,
    "height": 2.3,
    "yaw": 59,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_round_tree-1781598572336-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_round_tree-1781598572336; clusterMode=smallCluster; candidateType=fluffy_round_tree; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598579259-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0377",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.430762,
      "lng": 120.095644
    },
    "scale": 93.08,
    "height": 2.3,
    "yaw": -89,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598579259-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598579259; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598579259-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0378",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.430728,
      "lng": 120.095495
    },
    "scale": 96.21,
    "height": 2.3,
    "yaw": 92,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598579259-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598579259; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598579259-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0379",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.430629,
      "lng": 120.095577
    },
    "scale": 79.17,
    "height": 2.3,
    "yaw": -90,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598579259-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598579259; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598579259-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0380",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.430716,
      "lng": 120.095656
    },
    "scale": 81.95,
    "height": 2.3,
    "yaw": 84,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598579259-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598579259; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598580014-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0381",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.430247,
      "lng": 120.094903
    },
    "scale": 86.28,
    "height": 2.4,
    "yaw": -77,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598580014-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598580014; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598580014-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0382",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.430126,
      "lng": 120.094818
    },
    "scale": 88.7,
    "height": 2.3,
    "yaw": 91,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598580014-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598580014; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598580014-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0383",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.4301,
      "lng": 120.094969
    },
    "scale": 90.95,
    "height": 2.3,
    "yaw": -105,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598580014-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598580014; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598580014-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0384",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.430221,
      "lng": 120.094954
    },
    "scale": 93.02,
    "height": 2.2,
    "yaw": 56,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598580014-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598580014; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598580660-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0385",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.430263,
      "lng": 120.095379
    },
    "scale": 96.62,
    "height": 2.2,
    "yaw": -119,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598580660-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598580660; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598580660-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0386",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.430165,
      "lng": 120.095359
    },
    "scale": 78.33,
    "height": 2.2,
    "yaw": 36,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598580660-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598580660; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598580660-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0387",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.430241,
      "lng": 120.095498
    },
    "scale": 79.87,
    "height": 2.1,
    "yaw": -173,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598580660-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598580660; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598580660-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0388",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.430325,
      "lng": 120.09538
    },
    "scale": 81.22,
    "height": 2,
    "yaw": -25,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598580660-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598580660; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598581596-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0389",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.429743,
      "lng": 120.095346
    },
    "scale": 84.1,
    "height": 2,
    "yaw": 146,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598581596-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598581596; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598581596-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0390",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.429718,
      "lng": 120.095403
    },
    "scale": 85.1,
    "height": 1.9,
    "yaw": -73,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598581596-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598581596; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598581596-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0391",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.429802,
      "lng": 120.095472
    },
    "scale": 85.92,
    "height": 1.8,
    "yaw": 65,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598581596-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598581596; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598581596-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0392",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.429792,
      "lng": 120.095309
    },
    "scale": 86.56,
    "height": 1.7,
    "yaw": -160,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598581596-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598581596; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598582350-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0393",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.429201,
      "lng": 120.095648
    },
    "scale": 88.71,
    "height": 2.5,
    "yaw": -3,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598582350-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598582350; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598582350-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0394",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.429219,
      "lng": 120.095733
    },
    "scale": 88.99,
    "height": 2.4,
    "yaw": 125,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598582350-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598582350; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598582350-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0395",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.429266,
      "lng": 120.095693
    },
    "scale": 89.1,
    "height": 2.2,
    "yaw": -110,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598582350-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598582350; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598582350-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0396",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.429235,
      "lng": 120.09568
    },
    "scale": 89.02,
    "height": 2.1,
    "yaw": 11,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598582350-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598582350; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598583067-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0397",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.428853,
      "lng": 120.096013
    },
    "scale": 90.44,
    "height": 2,
    "yaw": 155,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598583067-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598583067; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598583067-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0398",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.428928,
      "lng": 120.09607
    },
    "scale": 90.01,
    "height": 1.9,
    "yaw": -91,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598583067-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598583067; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598583067-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0399",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.428945,
      "lng": 120.095983
    },
    "scale": 89.39,
    "height": 1.7,
    "yaw": 20,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598583067-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598583067; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598583067-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0400",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.428886,
      "lng": 120.095992
    },
    "scale": 88.6,
    "height": 2.4,
    "yaw": 128,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598583067-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598583067; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598584002-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0401",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.431369,
      "lng": 120.096987
    },
    "scale": 89.29,
    "height": 2.3,
    "yaw": -102,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598584002-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598584002; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598584002-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0402",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.431471,
      "lng": 120.096965
    },
    "scale": 88.14,
    "height": 2.1,
    "yaw": -1,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598584002-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598584002; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598584002-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0403",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.431424,
      "lng": 120.096873
    },
    "scale": 86.81,
    "height": 1.9,
    "yaw": 97,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598584002-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598584002; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598584002-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0404",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.431373,
      "lng": 120.096941
    },
    "scale": 85.3,
    "height": 1.7,
    "yaw": -169,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598584002-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598584002; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598584638-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0405",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.431101,
      "lng": 120.097937
    },
    "scale": 85.25,
    "height": 2.4,
    "yaw": -52,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598584638-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598584638; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598584638-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0406",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.431168,
      "lng": 120.097827
    },
    "scale": 83.38,
    "height": 2.2,
    "yaw": 35,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598584638-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598584638; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598584638-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0407",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.431068,
      "lng": 120.097794
    },
    "scale": 81.33,
    "height": 2,
    "yaw": 119,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598584638-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598584638; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598584638-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0408",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.431071,
      "lng": 120.097901
    },
    "scale": 79.09,
    "height": 1.7,
    "yaw": -160,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598584638-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598584638; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598585311-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0409",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.431362,
      "lng": 120.097821
    },
    "scale": 78.32,
    "height": 2.4,
    "yaw": -57,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598585311-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598585311; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598585311-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0410",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.431344,
      "lng": 120.097676
    },
    "scale": 95.72,
    "height": 2.1,
    "yaw": 17,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598585311-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598585311; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598585311-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0411",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.431243,
      "lng": 120.097739
    },
    "scale": 92.95,
    "height": 1.9,
    "yaw": 88,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598585311-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598585311; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598585311-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0412",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.431316,
      "lng": 120.097824
    },
    "scale": 89.99,
    "height": 2.5,
    "yaw": 155,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598585311-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598585311; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598586007-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0413",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.430692,
      "lng": 120.097619
    },
    "scale": 88.48,
    "height": 2.3,
    "yaw": -116,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598586007-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598586007; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598586007-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0414",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.430585,
      "lng": 120.097522
    },
    "scale": 85.16,
    "height": 2,
    "yaw": -55,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598586007-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598586007; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598586007-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0415",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.430546,
      "lng": 120.097661
    },
    "scale": 81.66,
    "height": 1.7,
    "yaw": 2,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598586007-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598586007; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598586007-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0416",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.430661,
      "lng": 120.097664
    },
    "scale": 97.98,
    "height": 2.2,
    "yaw": 56,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598586007-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598586007; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598586724-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0417",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.430268,
      "lng": 120.097532
    },
    "scale": 95.73,
    "height": 2,
    "yaw": 131,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598586724-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598586724; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598586724-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0418",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.430125,
      "lng": 120.097551
    },
    "scale": 91.69,
    "height": 1.7,
    "yaw": 178,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598586724-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598586724; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598586724-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0419",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.430183,
      "lng": 120.097693
    },
    "scale": 87.46,
    "height": 2.2,
    "yaw": -138,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598586724-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598586724; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598586724-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0420",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.430274,
      "lng": 120.097594
    },
    "scale": 83.06,
    "height": 1.9,
    "yaw": -98,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598586724-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598586724; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598587354-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0421",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.430227,
      "lng": 120.098285
    },
    "scale": 80.07,
    "height": 2.5,
    "yaw": -36,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598587354-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598587354; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598587354-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0422",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.430211,
      "lng": 120.098324
    },
    "scale": 95.3,
    "height": 2.1,
    "yaw": -3,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598587354-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598587354; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598587354-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0423",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.43027,
      "lng": 120.098405
    },
    "scale": 90.35,
    "height": 1.8,
    "yaw": 27,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598587354-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598587354; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598587354-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0424",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.430278,
      "lng": 120.098249
    },
    "scale": 85.21,
    "height": 2.3,
    "yaw": 54,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598587354-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598587354; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598588158-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0425",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.429661,
      "lng": 120.097472
    },
    "scale": 81.48,
    "height": 2,
    "yaw": 102,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598588158-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598588158; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598588158-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0426",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.429671,
      "lng": 120.097544
    },
    "scale": 95.98,
    "height": 2.4,
    "yaw": 121,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598588158-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598588158; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598588158-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0427",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.429705,
      "lng": 120.097516
    },
    "scale": 90.3,
    "height": 2.1,
    "yaw": 138,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598588158-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598588158; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598588158-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0428",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.429685,
      "lng": 120.097409
    },
    "scale": 84.44,
    "height": 1.7,
    "yaw": 151,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598588158-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598588158; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598588963-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0429",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.429395,
      "lng": 120.097311
    },
    "scale": 79.97,
    "height": 2.2,
    "yaw": -175,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598588963-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598588963; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598588963-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0430",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.429457,
      "lng": 120.097371
    },
    "scale": 93.74,
    "height": 1.8,
    "yaw": -169,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598588963-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598588963; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598588963-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0431",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.429477,
      "lng": 120.097298
    },
    "scale": 87.33,
    "height": 2.2,
    "yaw": -166,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598588963-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598588963; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598588963-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0432",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.429433,
      "lng": 120.097303
    },
    "scale": 80.74,
    "height": 1.8,
    "yaw": -167,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598588963-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598588963; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598590115-1",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0433",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.429881,
      "lng": 120.098008
    },
    "scale": 95.52,
    "height": 2.3,
    "yaw": -146,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598590115-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598590115; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598590115-2",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0434",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.429976,
      "lng": 120.098
    },
    "scale": 88.56,
    "height": 1.9,
    "yaw": -154,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598590115-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598590115; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598590115-3",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0435",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.429942,
      "lng": 120.097912
    },
    "scale": 81.42,
    "height": 2.3,
    "yaw": -165,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598590115-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598590115; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-fluffy_tree_mix-1781598590115-4",
    "zoneId": "manual-tier-2",
    "kind": "fluffy_tree_mix",
    "name": "手动树群 0436",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-round-tree-b.glb",
    "location": {
      "lat": 31.429894,
      "lng": 120.097965
    },
    "scale": 94.09,
    "height": 1.8,
    "yaw": -179,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_tree_mix-1781598590115-4; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_tree_mix-1781598590115; clusterMode=smallCluster; candidateType=fluffy_tree_mix; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598597488-1",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0437",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.430832,
      "lng": 120.095853
    },
    "scale": 88.13,
    "height": 2.3,
    "yaw": -173,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598597488-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598597488; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598597488-2",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0438",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.430904,
      "lng": 120.09576
    },
    "scale": 80.44,
    "height": 1.8,
    "yaw": 166,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598597488-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598597488; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598597488-3",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0439",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.430816,
      "lng": 120.095717
    },
    "scale": 92.56,
    "height": 2.2,
    "yaw": 142,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598597488-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598597488; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598597488-4",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0440",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.430809,
      "lng": 120.095813
    },
    "scale": 84.5,
    "height": 1.7,
    "yaw": 114,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598597488-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598597488; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598598373-1",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0441",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.431251,
      "lng": 120.096222
    },
    "scale": 97.8,
    "height": 2.1,
    "yaw": 106,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598598373-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598598373; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598598373-2",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0442",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.431248,
      "lng": 120.096083
    },
    "scale": 89.37,
    "height": 2.4,
    "yaw": 72,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598598373-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598598373; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598598373-3",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0443",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.431147,
      "lng": 120.096128
    },
    "scale": 80.76,
    "height": 2,
    "yaw": 33,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598598373-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598598373; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598598373-4",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0444",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.431206,
      "lng": 120.096216
    },
    "scale": 91.96,
    "height": 2.3,
    "yaw": -8,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598598373-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598598373; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598600698-1",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0445",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425855,
      "lng": 120.100121
    },
    "scale": 84.51,
    "height": 1.8,
    "yaw": -30,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598600698-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598600698; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598600698-2",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0446",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425764,
      "lng": 120.100015
    },
    "scale": 95.35,
    "height": 2.1,
    "yaw": -78,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598600698-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598600698; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598600698-3",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0447",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425713,
      "lng": 120.100141
    },
    "scale": 86,
    "height": 2.4,
    "yaw": -130,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598600698-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598600698; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598600698-4",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0448",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425819,
      "lng": 120.100159
    },
    "scale": 96.47,
    "height": 1.9,
    "yaw": 175,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598600698-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598600698; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598601357-1",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0449",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425874,
      "lng": 120.10022
    },
    "scale": 88.26,
    "height": 2.3,
    "yaw": 139,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598601357-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598601357; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598601357-2",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0450",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425736,
      "lng": 120.100219
    },
    "scale": 78.36,
    "height": 1.7,
    "yaw": 77,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598601357-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598601357; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598601357-3",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0451",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425777,
      "lng": 120.100361
    },
    "scale": 88.27,
    "height": 2,
    "yaw": 11,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598601357-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598601357; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598601357-4",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0452",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425873,
      "lng": 120.100282
    },
    "scale": 78,
    "height": 2.2,
    "yaw": -58,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598601357-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598601357; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598602087-1",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0453",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425571,
      "lng": 120.100561
    },
    "scale": 89.05,
    "height": 1.8,
    "yaw": -107,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598602087-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598602087; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598602087-2",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0454",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.42548,
      "lng": 120.100595
    },
    "scale": 78.41,
    "height": 2,
    "yaw": 177,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598602087-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598602087; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598602087-3",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0455",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425602,
      "lng": 120.100669
    },
    "scale": 87.58,
    "height": 2.2,
    "yaw": 98,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598602087-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598602087; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598602087-4",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0456",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425626,
      "lng": 120.100522
    },
    "scale": 96.57,
    "height": 2.4,
    "yaw": 15,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598602087-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598602087; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598602804-1",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0457",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425377,
      "lng": 120.100879
    },
    "scale": 86.87,
    "height": 1.9,
    "yaw": -49,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598602804-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598602804; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598602804-2",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0458",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425382,
      "lng": 120.100935
    },
    "scale": 95.48,
    "height": 2.1,
    "yaw": -138,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598602804-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598602804; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598602804-3",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0459",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425479,
      "lng": 120.100951
    },
    "scale": 83.92,
    "height": 2.3,
    "yaw": 128,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598602804-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598602804; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598602804-4",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0460",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425404,
      "lng": 120.100817
    },
    "scale": 92.17,
    "height": 1.7,
    "yaw": 32,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598602804-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598602804; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598603528-1",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0461",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424932,
      "lng": 120.101142
    },
    "scale": 81.71,
    "height": 2,
    "yaw": -46,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598603528-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598603528; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598603528-2",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0462",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424981,
      "lng": 120.101199
    },
    "scale": 89.58,
    "height": 2.2,
    "yaw": -149,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598603528-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598603528; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598603528-3",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0463",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425,
      "lng": 120.101143
    },
    "scale": 97.27,
    "height": 2.3,
    "yaw": 104,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598603528-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598603528; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598603528-4",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0464",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424922,
      "lng": 120.101073
    },
    "scale": 84.78,
    "height": 2.5,
    "yaw": -6,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598603528-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598603528; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598604146-1",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0465",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.42476,
      "lng": 120.101331
    },
    "scale": 93.56,
    "height": 1.9,
    "yaw": -98,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598604146-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598604146; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598604146-2",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0466",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424845,
      "lng": 120.101335
    },
    "scale": 80.69,
    "height": 2.1,
    "yaw": 145,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598604146-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598604146; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598604146-3",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0467",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424823,
      "lng": 120.101255
    },
    "scale": 87.64,
    "height": 2.2,
    "yaw": 24,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598604146-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598604146; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598604146-4",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0468",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424781,
      "lng": 120.101294
    },
    "scale": 94.4,
    "height": 2.3,
    "yaw": -100,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598604146-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598604146; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598604909-1",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0469",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424374,
      "lng": 120.101321
    },
    "scale": 82.43,
    "height": 1.7,
    "yaw": 154,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598604909-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598604909; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598604909-2",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0470",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424448,
      "lng": 120.101244
    },
    "scale": 88.82,
    "height": 1.8,
    "yaw": 23,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598604909-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598604909; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598604909-3",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0471",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424373,
      "lng": 120.101194
    },
    "scale": 95.02,
    "height": 2,
    "yaw": -112,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598604909-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598604909; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598604909-4",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0472",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424358,
      "lng": 120.101277
    },
    "scale": 81.03,
    "height": 2.1,
    "yaw": 110,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598604909-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598604909; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598605600-1",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0473",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423965,
      "lng": 120.100374
    },
    "scale": 88.3,
    "height": 2.2,
    "yaw": -10,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598605600-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598605600; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598605600-2",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0474",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423974,
      "lng": 120.100244
    },
    "scale": 93.94,
    "height": 2.3,
    "yaw": -155,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598605600-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598605600; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598605600-3",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0475",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423878,
      "lng": 120.100273
    },
    "scale": 79.4,
    "height": 2.4,
    "yaw": 57,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598605600-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598605600; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598605600-4",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0476",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423922,
      "lng": 120.10036
    },
    "scale": 84.67,
    "height": 2.5,
    "yaw": -95,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598605600-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598605600; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598606306-1",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0477",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423773,
      "lng": 120.100335
    },
    "scale": 91.17,
    "height": 1.8,
    "yaw": 131,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598606306-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598606306; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598606306-2",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0478",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423697,
      "lng": 120.100224
    },
    "scale": 96.07,
    "height": 1.8,
    "yaw": -28,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598606306-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598606306; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598606306-3",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0479",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423638,
      "lng": 120.100334
    },
    "scale": 80.77,
    "height": 1.9,
    "yaw": 170,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598606306-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598606306; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598606306-4",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0480",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423733,
      "lng": 120.100365
    },
    "scale": 85.29,
    "height": 1.9,
    "yaw": 4,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598606306-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598606306; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598607274-1",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0481",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424133,
      "lng": 120.099465
    },
    "scale": 91.04,
    "height": 2,
    "yaw": -144,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598607274-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598607274; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598607274-2",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0482",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424002,
      "lng": 120.099445
    },
    "scale": 95.18,
    "height": 2.1,
    "yaw": 43,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598607274-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598607274; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598607274-3",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0483",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424027,
      "lng": 120.099585
    },
    "scale": 79.14,
    "height": 2.1,
    "yaw": -133,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598607274-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598607274; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598607274-4",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0484",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424124,
      "lng": 120.099524
    },
    "scale": 82.91,
    "height": 2.1,
    "yaw": 47,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598607274-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598607274; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598608528-1",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0485",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424072,
      "lng": 120.09894
    },
    "scale": 87.9,
    "height": 2.2,
    "yaw": -115,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598608528-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598608528; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598608528-2",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0486",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423959,
      "lng": 120.099039
    },
    "scale": 91.29,
    "height": 2.2,
    "yaw": 59,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598608528-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598608528; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598608528-3",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0487",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424067,
      "lng": 120.099126
    },
    "scale": 94.5,
    "height": 2.2,
    "yaw": -132,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598608528-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598608528; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598608528-4",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0488",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424105,
      "lng": 120.098992
    },
    "scale": 97.51,
    "height": 2.1,
    "yaw": 35,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598608528-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598608528; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598609285-1",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0489",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423901,
      "lng": 120.098292
    },
    "scale": 81.73,
    "height": 2.2,
    "yaw": -142,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598609285-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598609285; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598609285-2",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0490",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423848,
      "lng": 120.098394
    },
    "scale": 84.37,
    "height": 2.1,
    "yaw": 18,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598609285-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598609285; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598609285-3",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0491",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423987,
      "lng": 120.098367
    },
    "scale": 86.83,
    "height": 2.1,
    "yaw": 174,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598609285-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598609285; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598609285-4",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0492",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423931,
      "lng": 120.098229
    },
    "scale": 89.09,
    "height": 2.1,
    "yaw": -34,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598609285-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598609285; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598610506-1",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0493",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423778,
      "lng": 120.097241
    },
    "scale": 92.55,
    "height": 2.1,
    "yaw": 135,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598610506-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598610506; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598610506-2",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0494",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423814,
      "lng": 120.097292
    },
    "scale": 94.44,
    "height": 2,
    "yaw": -79,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598610506-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598610506; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598610506-3",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0495",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423822,
      "lng": 120.097256
    },
    "scale": 96.14,
    "height": 1.9,
    "yaw": 63,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598610506-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598610506; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598610506-4",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0496",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423772,
      "lng": 120.097172
    },
    "scale": 97.65,
    "height": 1.8,
    "yaw": -159,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598610506-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598610506; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598611655-1",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0497",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425157,
      "lng": 120.094984
    },
    "scale": 80.34,
    "height": 1.8,
    "yaw": -4,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598611655-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598611655; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598611655-2",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0498",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425232,
      "lng": 120.094997
    },
    "scale": 81.47,
    "height": 1.7,
    "yaw": 128,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598611655-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598611655; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598611655-3",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0499",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425219,
      "lng": 120.094929
    },
    "scale": 82.41,
    "height": 2.4,
    "yaw": -104,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598611655-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598611655; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598611655-4",
    "zoneId": "manual-tier-2",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0500",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425193,
      "lng": 120.094958
    },
    "scale": 83.17,
    "height": 2.3,
    "yaw": 20,
    "opacity": 0.92,
    "visible": true,
    "priority": "medium",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598611655-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598611655; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=2."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598612464-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0501",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424553,
      "lng": 120.094833
    },
    "scale": 85.09,
    "height": 2.3,
    "yaw": 161,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598612464-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598612464; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598612464-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0502",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424628,
      "lng": 120.094772
    },
    "scale": 85.47,
    "height": 2.1,
    "yaw": -82,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598612464-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598612464; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598612464-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0503",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424565,
      "lng": 120.094719
    },
    "scale": 85.66,
    "height": 2,
    "yaw": 32,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598612464-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598612464; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598612464-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0504",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424548,
      "lng": 120.094787
    },
    "scale": 85.66,
    "height": 1.9,
    "yaw": 143,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598612464-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598612464; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598613735-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0505",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.42419,
      "lng": 120.094836
    },
    "scale": 86.8,
    "height": 1.8,
    "yaw": -90,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598613735-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598613735; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598613735-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0506",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424212,
      "lng": 120.094717
    },
    "scale": 86.42,
    "height": 2.4,
    "yaw": 13,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598613735-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598613735; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598613735-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0507",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424121,
      "lng": 120.094731
    },
    "scale": 85.85,
    "height": 2.3,
    "yaw": 113,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598613735-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598613735; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598613735-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0508",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424153,
      "lng": 120.094814
    },
    "scale": 85.1,
    "height": 2.1,
    "yaw": -151,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598613735-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598613735; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598614910-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0509",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.422862,
      "lng": 120.100945
    },
    "scale": 85.47,
    "height": 2,
    "yaw": -38,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598614910-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598614910; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598614910-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0510",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.422801,
      "lng": 120.100831
    },
    "scale": 84.34,
    "height": 1.8,
    "yaw": 51,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598614910-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598614910; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598614910-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0511",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.422735,
      "lng": 120.100925
    },
    "scale": 83.01,
    "height": 2.4,
    "yaw": 137,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598614910-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598614910; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598614910-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0512",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.422819,
      "lng": 120.100967
    },
    "scale": 81.49,
    "height": 2.2,
    "yaw": -141,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598614910-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598614910; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598615804-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0513",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423366,
      "lng": 120.10184
    },
    "scale": 81.1,
    "height": 2,
    "yaw": -43,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598615804-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598615804; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598615804-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0514",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423244,
      "lng": 120.101805
    },
    "scale": 79.2,
    "height": 1.8,
    "yaw": 32,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598615804-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598615804; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598615804-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0515",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423253,
      "lng": 120.101939
    },
    "scale": 97.11,
    "height": 2.4,
    "yaw": 104,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598615804-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598615804; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598615804-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0516",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423349,
      "lng": 120.101896
    },
    "scale": 94.83,
    "height": 2.2,
    "yaw": 172,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598615804-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598615804; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598616894-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0517",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.42376,
      "lng": 120.102397
    },
    "scale": 93.66,
    "height": 2,
    "yaw": -104,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598616894-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598616894; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598616894-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0518",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423643,
      "lng": 120.102475
    },
    "scale": 91,
    "height": 1.7,
    "yaw": -43,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598616894-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598616894; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598616894-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0519",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423736,
      "lng": 120.102573
    },
    "scale": 88.15,
    "height": 2.3,
    "yaw": 15,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598616894-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598616894; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598616894-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0520",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.423786,
      "lng": 120.102452
    },
    "scale": 85.11,
    "height": 2,
    "yaw": 69,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598616894-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598616894; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598618075-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0521",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426531,
      "lng": 120.103082
    },
    "scale": 83.17,
    "height": 1.8,
    "yaw": 139,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598618075-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598618075; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598618075-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0522",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426466,
      "lng": 120.103153
    },
    "scale": 79.74,
    "height": 2.3,
    "yaw": -174,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598618075-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598618075; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598618075-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0523",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.4266,
      "lng": 120.103147
    },
    "scale": 96.13,
    "height": 2.1,
    "yaw": -131,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598618075-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598618075; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598618075-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0524",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426562,
      "lng": 120.10301
    },
    "scale": 92.33,
    "height": 1.8,
    "yaw": -91,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598618075-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598618075; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598619011-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0525",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426497,
      "lng": 120.103722
    },
    "scale": 89.61,
    "height": 2.3,
    "yaw": -35,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598619011-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598619011; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598619011-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0526",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426523,
      "lng": 120.103758
    },
    "scale": 85.42,
    "height": 2,
    "yaw": -2,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598619011-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598619011; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598619011-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0527",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426611,
      "lng": 120.103724
    },
    "scale": 81.04,
    "height": 1.7,
    "yaw": 27,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598619011-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598619011; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598619011-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0528",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426494,
      "lng": 120.103651
    },
    "scale": 96.48,
    "height": 2.2,
    "yaw": 53,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598619011-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598619011; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598619640-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0529",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426829,
      "lng": 120.103594
    },
    "scale": 92.98,
    "height": 1.9,
    "yaw": 94,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598619640-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598619640; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598619640-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0530",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426891,
      "lng": 120.103612
    },
    "scale": 88.03,
    "height": 2.4,
    "yaw": 112,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598619640-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598619640; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598619640-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0531",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426883,
      "lng": 120.103561
    },
    "scale": 82.89,
    "height": 2,
    "yaw": 128,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598619640-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598619640; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598619640-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0532",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426791,
      "lng": 120.103539
    },
    "scale": 97.55,
    "height": 2.5,
    "yaw": 139,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598619640-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598619640; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598620591-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0533",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.42724,
      "lng": 120.10303
    },
    "scale": 93.28,
    "height": 2.2,
    "yaw": 166,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598620591-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598620591; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598620591-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0534",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.427312,
      "lng": 120.102985
    },
    "scale": 87.56,
    "height": 1.8,
    "yaw": 171,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598620591-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598620591; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598620591-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0535",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.427262,
      "lng": 120.102933
    },
    "scale": 81.65,
    "height": 2.2,
    "yaw": 172,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598620591-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598620591; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598620591-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0536",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.427246,
      "lng": 120.102984
    },
    "scale": 95.55,
    "height": 1.8,
    "yaw": 169,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598620591-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598620591; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598621655-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0537",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426236,
      "lng": 120.102278
    },
    "scale": 90.49,
    "height": 2.3,
    "yaw": -179,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598621655-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598621655; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598621655-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0538",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426266,
      "lng": 120.102172
    },
    "scale": 84.01,
    "height": 1.9,
    "yaw": 172,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598621655-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598621655; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598621655-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0539",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426183,
      "lng": 120.102173
    },
    "scale": 97.33,
    "height": 2.3,
    "yaw": 159,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598621655-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598621655; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598621655-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0540",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426204,
      "lng": 120.102247
    },
    "scale": 90.46,
    "height": 1.9,
    "yaw": 142,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598621655-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598621655; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598622978-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0541",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.428393,
      "lng": 120.103935
    },
    "scale": 84.62,
    "height": 2.3,
    "yaw": 140,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598622978-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598622978; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598622978-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0542",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.428347,
      "lng": 120.10382
    },
    "scale": 97.37,
    "height": 1.9,
    "yaw": 116,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598622978-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598622978; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598622978-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0543",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.428278,
      "lng": 120.103898
    },
    "scale": 89.92,
    "height": 2.2,
    "yaw": 89,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598622978-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598622978; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598622978-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0544",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.428349,
      "lng": 120.103946
    },
    "scale": 82.28,
    "height": 1.8,
    "yaw": 58,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598622978-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598622978; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598623634-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0545",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.42903,
      "lng": 120.10383
    },
    "scale": 95.66,
    "height": 2.2,
    "yaw": 41,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598623634-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598623634; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598623634-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0546",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.428919,
      "lng": 120.10378
    },
    "scale": 87.64,
    "height": 1.7,
    "yaw": 3,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598623634-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598623634; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598623634-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0547",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.428914,
      "lng": 120.103907
    },
    "scale": 79.42,
    "height": 2,
    "yaw": -38,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598623634-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598623634; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598623634-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0548",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.429007,
      "lng": 120.103881
    },
    "scale": 91.01,
    "height": 2.4,
    "yaw": -83,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598623634-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598623634; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598624241-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0549",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.429268,
      "lng": 120.103361
    },
    "scale": 83.61,
    "height": 1.9,
    "yaw": -115,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598624241-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598624241; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598624241-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0550",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.42915,
      "lng": 120.10342
    },
    "scale": 94.81,
    "height": 2.2,
    "yaw": -167,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598624241-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598624241; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598624241-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0551",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.429227,
      "lng": 120.103524
    },
    "scale": 85.82,
    "height": 1.7,
    "yaw": 137,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598624241-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598624241; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598624241-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0552",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.429286,
      "lng": 120.103419
    },
    "scale": 96.64,
    "height": 2,
    "yaw": 78,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598624241-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598624241; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598625124-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0553",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.428245,
      "lng": 120.104815
    },
    "scale": 88.45,
    "height": 2.4,
    "yaw": 32,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598625124-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598625124; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598625124-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0554",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.428191,
      "lng": 120.104964
    },
    "scale": 78.89,
    "height": 1.8,
    "yaw": -34,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598625124-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598625124; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598625124-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0555",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.428318,
      "lng": 120.104977
    },
    "scale": 89.13,
    "height": 2.1,
    "yaw": -104,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598625124-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598625124; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598625124-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0556",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.428297,
      "lng": 120.104842
    },
    "scale": 79.17,
    "height": 2.4,
    "yaw": -178,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598625124-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598625124; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598625867-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0557",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.427981,
      "lng": 120.105143
    },
    "scale": 90.2,
    "height": 1.9,
    "yaw": 122,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598625867-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598625867; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598625867-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0558",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.427974,
      "lng": 120.105256
    },
    "scale": 79.85,
    "height": 2.1,
    "yaw": 41,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598625867-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598625867; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598625867-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0559",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.428081,
      "lng": 120.105156
    },
    "scale": 89.32,
    "height": 2.4,
    "yaw": -43,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598625867-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598625867; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598625867-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0560",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.427978,
      "lng": 120.105069
    },
    "scale": 78.59,
    "height": 1.8,
    "yaw": -131,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598625867-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598625867; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598626685-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0561",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426873,
      "lng": 120.10479
    },
    "scale": 88.83,
    "height": 2.1,
    "yaw": 155,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598626685-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598626685; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598626685-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0562",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426922,
      "lng": 120.104808
    },
    "scale": 97.71,
    "height": 2.3,
    "yaw": 60,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598626685-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598626685; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598626685-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0563",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426973,
      "lng": 120.10471
    },
    "scale": 86.4,
    "height": 2.5,
    "yaw": -39,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598626685-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598626685; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598626685-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0564",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426839,
      "lng": 120.104732
    },
    "scale": 94.9,
    "height": 1.9,
    "yaw": -141,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598626685-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598626685; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598627375-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0565",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426552,
      "lng": 120.104831
    },
    "scale": 84.35,
    "height": 2.1,
    "yaw": 130,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598627375-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598627375; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598627375-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0566",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426618,
      "lng": 120.1048
    },
    "scale": 92.46,
    "height": 2.3,
    "yaw": 20,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598627375-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598627375; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598627375-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0567",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.42658,
      "lng": 120.104755
    },
    "scale": 80.37,
    "height": 2.5,
    "yaw": -92,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598627375-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598627375; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598627375-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0568",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426493,
      "lng": 120.104809
    },
    "scale": 88.09,
    "height": 1.8,
    "yaw": 151,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598627375-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598627375; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598628008-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0569",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426261,
      "lng": 120.105235
    },
    "scale": 96.75,
    "height": 2,
    "yaw": 47,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598628008-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598628008; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598628008-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0570",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426297,
      "lng": 120.105143
    },
    "scale": 84.08,
    "height": 2.2,
    "yaw": -76,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598628008-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598628008; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598628008-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0571",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426225,
      "lng": 120.105134
    },
    "scale": 91.22,
    "height": 2.3,
    "yaw": 157,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598628008-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598628008; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598628008-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0572",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.426238,
      "lng": 120.105196
    },
    "scale": 78.16,
    "height": 2.5,
    "yaw": 26,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598628008-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598628008; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598628707-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0573",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425821,
      "lng": 120.105066
    },
    "scale": 86.03,
    "height": 1.8,
    "yaw": -93,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598628707-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598628707; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598628707-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0574",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425789,
      "lng": 120.104954
    },
    "scale": 92.58,
    "height": 2,
    "yaw": 130,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598628707-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598628707; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598628707-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0575",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425719,
      "lng": 120.105016
    },
    "scale": 78.94,
    "height": 2.1,
    "yaw": -12,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598628707-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598628707; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598628707-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0576",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425778,
      "lng": 120.105066
    },
    "scale": 85.11,
    "height": 2.2,
    "yaw": -157,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598628707-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598628707; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598629523-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0577",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425161,
      "lng": 120.104524
    },
    "scale": 92.18,
    "height": 2.3,
    "yaw": 70,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598629523-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598629523; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598629523-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0578",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425062,
      "lng": 120.104463
    },
    "scale": 97.96,
    "height": 2.4,
    "yaw": -82,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598629523-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598629523; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598629523-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0579",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425045,
      "lng": 120.104579
    },
    "scale": 83.54,
    "height": 2.5,
    "yaw": 122,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598629523-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598629523; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598629523-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0580",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.425132,
      "lng": 120.104568
    },
    "scale": 88.92,
    "height": 1.8,
    "yaw": -37,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598629523-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598629523; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598630610-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0581",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424118,
      "lng": 120.103882
    },
    "scale": 95.2,
    "height": 1.9,
    "yaw": 175,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598630610-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598630610; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598630610-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0582",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424,
      "lng": 120.103921
    },
    "scale": 80.2,
    "height": 1.9,
    "yaw": 8,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598630610-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598630610; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598630610-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0583",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424062,
      "lng": 120.10403
    },
    "scale": 84.99,
    "height": 2,
    "yaw": -162,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598630610-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598630610; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598630610-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0584",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.424127,
      "lng": 120.103941
    },
    "scale": 89.6,
    "height": 2,
    "yaw": 24,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598630610-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598630610; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598636174-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0585",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.420697,
      "lng": 120.102436
    },
    "scale": 95.09,
    "height": 2.1,
    "yaw": -138,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598636174-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598636174; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598636174-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0586",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.42063,
      "lng": 120.10257
    },
    "scale": 79.3,
    "height": 2.1,
    "yaw": 41,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598636174-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598636174; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598636174-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0587",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.420749,
      "lng": 120.102601
    },
    "scale": 83.32,
    "height": 2.2,
    "yaw": -143,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598636174-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598636174; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598636174-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0588",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.420744,
      "lng": 120.102471
    },
    "scale": 87.14,
    "height": 2.2,
    "yaw": 29,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598636174-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598636174; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598637125-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0589",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.421258,
      "lng": 120.10197
    },
    "scale": 91.83,
    "height": 2.2,
    "yaw": -148,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598637125-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598637125; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598637125-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0590",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.421292,
      "lng": 120.10213
    },
    "scale": 95.26,
    "height": 2.2,
    "yaw": 16,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598637125-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598637125; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598637125-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0591",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.421404,
      "lng": 120.10205
    },
    "scale": 78.5,
    "height": 2.2,
    "yaw": 177,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598637125-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598637125; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598637125-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0592",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.421316,
      "lng": 120.101953
    },
    "scale": 81.54,
    "height": 2.2,
    "yaw": -25,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598637125-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598637125; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598637840-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0593",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.421537,
      "lng": 120.101386
    },
    "scale": 85.43,
    "height": 2.2,
    "yaw": 143,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598637840-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598637840; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598637840-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0594",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.421567,
      "lng": 120.101389
    },
    "scale": 88.08,
    "height": 2.1,
    "yaw": -66,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598637840-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598637840; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598637840-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0595",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.421633,
      "lng": 120.101323
    },
    "scale": 90.53,
    "height": 2.1,
    "yaw": 80,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598637840-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598637840; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598637840-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0596",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.421503,
      "lng": 120.101325
    },
    "scale": 92.78,
    "height": 2,
    "yaw": -137,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598637840-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598637840; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598638794-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0597",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.422062,
      "lng": 120.100592
    },
    "scale": 95.88,
    "height": 2,
    "yaw": 17,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598638794-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598638794; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598638794-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0598",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.422118,
      "lng": 120.100572
    },
    "scale": 97.75,
    "height": 2,
    "yaw": 153,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598638794-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598638794; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598638794-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0599",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.422092,
      "lng": 120.100544
    },
    "scale": 79.41,
    "height": 1.9,
    "yaw": -75,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598638794-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598638794; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598638794-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0600",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.422005,
      "lng": 120.100565
    },
    "scale": 80.88,
    "height": 1.8,
    "yaw": 54,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598638794-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598638794; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598641790-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0601",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.422275,
      "lng": 120.102396
    },
    "scale": 83.18,
    "height": 1.8,
    "yaw": -167,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598641790-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598641790; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598641790-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0602",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.422315,
      "lng": 120.102319
    },
    "scale": 84.26,
    "height": 2.5,
    "yaw": -46,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598641790-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598641790; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598641790-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0603",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.422255,
      "lng": 120.102305
    },
    "scale": 85.14,
    "height": 2.3,
    "yaw": 72,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598641790-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598641790; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598641790-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0604",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.422266,
      "lng": 120.102347
    },
    "scale": 85.82,
    "height": 2.2,
    "yaw": -174,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598641790-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598641790; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598643711-1",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0605",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.421957,
      "lng": 120.101785
    },
    "scale": 87.33,
    "height": 2.1,
    "yaw": -49,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598643711-1; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598643711; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598643711-2",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0606",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.421939,
      "lng": 120.101679
    },
    "scale": 87.62,
    "height": 2,
    "yaw": 58,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598643711-2; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598643711; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598643711-3",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0607",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.421871,
      "lng": 120.101725
    },
    "scale": 87.71,
    "height": 1.9,
    "yaw": 161,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598643711-3; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598643711; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-bushy_canopy_tree-1781598643711-4",
    "zoneId": "manual-tier-3",
    "kind": "bushy_canopy_tree",
    "name": "手动树群 0608",
    "assetUrl": "/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb",
    "location": {
      "lat": 31.421917,
      "lng": 120.101774
    },
    "scale": 87.61,
    "height": 1.7,
    "yaw": -99,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-bushy_canopy_tree-1781598643711-4; originalSource=treeCandidateLab; clusterId=tree-lab-bushy_canopy_tree-1781598643711; clusterMode=smallCluster; candidateType=bushy_canopy_tree; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598649606-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0609",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.429294,
      "lng": 120.096702
    },
    "scale": 88.31,
    "height": 2.4,
    "yaw": 11,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598649606-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598649606; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598649606-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0610",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.429208,
      "lng": 120.096633
    },
    "scale": 87.81,
    "height": 2.2,
    "yaw": 103,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598649606-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598649606; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598649606-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0611",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.429182,
      "lng": 120.096736
    },
    "scale": 87.12,
    "height": 2.1,
    "yaw": -168,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598649606-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598649606; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598649606-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0612",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.42926,
      "lng": 120.096737
    },
    "scale": 86.22,
    "height": 1.9,
    "yaw": -83,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598649606-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598649606; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598650490-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0613",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.429081,
      "lng": 120.096874
    },
    "scale": 86.12,
    "height": 1.8,
    "yaw": 12,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598650490-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598650490; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598650490-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0614",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.428967,
      "lng": 120.096895
    },
    "scale": 84.84,
    "height": 2.4,
    "yaw": 90,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598650490-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598650490; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598650490-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0615",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.429014,
      "lng": 120.097004
    },
    "scale": 83.35,
    "height": 2.2,
    "yaw": 165,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598650490-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598650490; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598650490-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0616",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.429081,
      "lng": 120.096932
    },
    "scale": 81.67,
    "height": 1.9,
    "yaw": -124,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598650490-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598650490; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598651140-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0617",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.42857,
      "lng": 120.096883
    },
    "scale": 80.77,
    "height": 1.8,
    "yaw": -44,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598651140-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598651140; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598651140-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0618",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.428494,
      "lng": 120.097001
    },
    "scale": 78.7,
    "height": 2.3,
    "yaw": 19,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598651140-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598651140; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598651140-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0619",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.428602,
      "lng": 120.097046
    },
    "scale": 96.42,
    "height": 2.1,
    "yaw": 79,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598651140-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598651140; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598651140-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0620",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.42861,
      "lng": 120.096925
    },
    "scale": 93.95,
    "height": 1.9,
    "yaw": 136,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598651140-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598651140; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598653717-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0621",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.42721,
      "lng": 120.099194
    },
    "scale": 92.25,
    "height": 2.4,
    "yaw": -159,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598653717-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598653717; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598653717-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0622",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.427226,
      "lng": 120.099351
    },
    "scale": 89.38,
    "height": 2.2,
    "yaw": -110,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598653717-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598653717; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598653717-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0623",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.42734,
      "lng": 120.099291
    },
    "scale": 86.32,
    "height": 1.9,
    "yaw": -64,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598653717-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598653717; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598653717-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0624",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.427268,
      "lng": 120.099188
    },
    "scale": 83.06,
    "height": 2.5,
    "yaw": -22,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598653717-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598653717; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598655058-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0625",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.428105,
      "lng": 120.100313
    },
    "scale": 80.55,
    "height": 2.2,
    "yaw": 28,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598655058-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598655058; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598655058-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0626",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.42814,
      "lng": 120.100412
    },
    "scale": 96.89,
    "height": 1.9,
    "yaw": 63,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598655058-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598655058; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598655058-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0627",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.42819,
      "lng": 120.100267
    },
    "scale": 93.03,
    "height": 2.4,
    "yaw": 94,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598655058-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598655058; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598655058-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0628",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.428067,
      "lng": 120.100249
    },
    "scale": 88.98,
    "height": 2.1,
    "yaw": 121,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598655058-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598655058; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598656289-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0629",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.429632,
      "lng": 120.101907
    },
    "scale": 85.66,
    "height": 1.8,
    "yaw": 157,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598656289-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598656289; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598656289-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0630",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.429674,
      "lng": 120.101894
    },
    "scale": 81.21,
    "height": 2.3,
    "yaw": 177,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598656289-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598656289; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598656289-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0631",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.429682,
      "lng": 120.101784
    },
    "scale": 96.57,
    "height": 2,
    "yaw": -166,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598656289-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598656289; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598656289-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0632",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.429576,
      "lng": 120.101877
    },
    "scale": 91.72,
    "height": 2.4,
    "yaw": -154,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598656289-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598656289; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598657064-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0633",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.429816,
      "lng": 120.102783
    },
    "scale": 87.6,
    "height": 2.1,
    "yaw": -132,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598657064-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598657064; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598657064-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0634",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.429856,
      "lng": 120.102721
    },
    "scale": 82.36,
    "height": 1.8,
    "yaw": -127,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598657064-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598657064; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598657064-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0635",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.429811,
      "lng": 120.102708
    },
    "scale": 96.91,
    "height": 2.2,
    "yaw": -125,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598657064-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598657064; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598657064-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0636",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.429755,
      "lng": 120.102797
    },
    "scale": 91.28,
    "height": 1.9,
    "yaw": -127,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598657064-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598657064; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598657811-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0637",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.4298,
      "lng": 120.103267
    },
    "scale": 86.35,
    "height": 2.3,
    "yaw": -120,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598657811-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598657811; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598657811-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0638",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.429792,
      "lng": 120.10317
    },
    "scale": 80.31,
    "height": 1.9,
    "yaw": -129,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598657811-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598657811; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598657811-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0639",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.429731,
      "lng": 120.103202
    },
    "scale": 94.07,
    "height": 2.3,
    "yaw": -142,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598657811-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598657811; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598657811-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0640",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.429764,
      "lng": 120.103242
    },
    "scale": 87.64,
    "height": 1.9,
    "yaw": -158,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598657811-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598657811; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598658714-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0641",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.42932,
      "lng": 120.104114
    },
    "scale": 81.9,
    "height": 2.4,
    "yaw": -167,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598658714-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598658714; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598658714-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0642",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.429248,
      "lng": 120.104039
    },
    "scale": 95.07,
    "height": 1.9,
    "yaw": 170,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598658714-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598658714; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598658714-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0643",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.429215,
      "lng": 120.104129
    },
    "scale": 88.04,
    "height": 2.3,
    "yaw": 142,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598658714-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598658714; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598658714-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0644",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.429282,
      "lng": 120.104138
    },
    "scale": 80.81,
    "height": 1.9,
    "yaw": 111,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598658714-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598658714; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598659292-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0645",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.429087,
      "lng": 120.104253
    },
    "scale": 94.26,
    "height": 2.3,
    "yaw": 88,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598659292-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598659292; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598659292-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0646",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.428979,
      "lng": 120.104258
    },
    "scale": 86.63,
    "height": 1.8,
    "yaw": 50,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598659292-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598659292; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598659292-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0647",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.429011,
      "lng": 120.104365
    },
    "scale": 78.81,
    "height": 2.2,
    "yaw": 8,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598659292-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598659292; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598659292-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0648",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.429079,
      "lng": 120.104309
    },
    "scale": 90.78,
    "height": 2.5,
    "yaw": -37,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598659292-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598659292; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598659916-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0649",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.428726,
      "lng": 120.103409
    },
    "scale": 83.42,
    "height": 2.1,
    "yaw": -75,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598659916-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598659916; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598659916-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0650",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.428643,
      "lng": 120.103509
    },
    "scale": 95,
    "height": 2.4,
    "yaw": -128,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598659916-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598659916; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598659916-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0651",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.428739,
      "lng": 120.103566
    },
    "scale": 86.37,
    "height": 1.9,
    "yaw": 176,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598659916-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598659916; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598659916-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0652",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.428759,
      "lng": 120.103457
    },
    "scale": 97.55,
    "height": 2.2,
    "yaw": 116,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598659916-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598659916; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598660789-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0653",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.427952,
      "lng": 120.104217
    },
    "scale": 89.39,
    "height": 1.7,
    "yaw": 63,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598660789-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598660789; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598660789-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0654",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.427952,
      "lng": 120.104368
    },
    "scale": 80.16,
    "height": 2,
    "yaw": -5,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598660789-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598660789; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598660789-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0655",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.428065,
      "lng": 120.104327
    },
    "scale": 90.74,
    "height": 2.3,
    "yaw": -76,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598660789-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598660789; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598660789-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0656",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.428009,
      "lng": 120.104221
    },
    "scale": 81.12,
    "height": 1.8,
    "yaw": -150,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598660789-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598660789; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598661428-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0657",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.42798,
      "lng": 120.10388
    },
    "scale": 92.14,
    "height": 2,
    "yaw": 142,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598661428-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598661428; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598661428-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0658",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.428076,
      "lng": 120.103997
    },
    "scale": 82.12,
    "height": 2.3,
    "yaw": 60,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598661428-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598661428; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598661428-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0659",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.428138,
      "lng": 120.103866
    },
    "scale": 91.9,
    "height": 1.7,
    "yaw": -26,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598661428-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598661428; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598661428-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0660",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.428025,
      "lng": 120.103831
    },
    "scale": 81.48,
    "height": 2,
    "yaw": -115,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598661428-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598661428; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598662167-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0661",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.427353,
      "lng": 120.1042
    },
    "scale": 91.69,
    "height": 2.2,
    "yaw": 163,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598662167-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598662167; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598662167-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0662",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.427442,
      "lng": 120.104251
    },
    "scale": 80.87,
    "height": 2.5,
    "yaw": 66,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598662167-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598662167; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598662167-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0663",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.427407,
      "lng": 120.104096
    },
    "scale": 89.85,
    "height": 1.9,
    "yaw": -34,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598662167-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598662167; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598662167-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0664",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.427297,
      "lng": 120.104167
    },
    "scale": 78.63,
    "height": 2.1,
    "yaw": -138,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598662167-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598662167; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598662834-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0665",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.427396,
      "lng": 120.104629
    },
    "scale": 88.02,
    "height": 2.3,
    "yaw": 125,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598662834-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598662834; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598662834-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0666",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.427431,
      "lng": 120.104582
    },
    "scale": 96.4,
    "height": 1.7,
    "yaw": 13,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598662834-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598662834; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598662834-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0667",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.427374,
      "lng": 120.104487
    },
    "scale": 84.58,
    "height": 1.9,
    "yaw": -101,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598662834-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598662834; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598662834-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0668",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.427335,
      "lng": 120.104638
    },
    "scale": 92.56,
    "height": 2.1,
    "yaw": 140,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598662834-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598662834; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598664208-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0669",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.425975,
      "lng": 120.097493
    },
    "scale": 81.14,
    "height": 2.3,
    "yaw": 28,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598664208-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598664208; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598664208-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0670",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.425977,
      "lng": 120.097408
    },
    "scale": 88.72,
    "height": 2.4,
    "yaw": -98,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598664208-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598664208; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598664208-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0671",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.425925,
      "lng": 120.09743
    },
    "scale": 96.1,
    "height": 1.8,
    "yaw": 132,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598664208-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598664208; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598664208-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0672",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.42593,
      "lng": 120.097546
    },
    "scale": 83.28,
    "height": 1.9,
    "yaw": -1,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598664208-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598664208; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598665272-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0673",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.424833,
      "lng": 120.098516
    },
    "scale": 91.04,
    "height": 2.1,
    "yaw": -128,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598665272-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598665272; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598665272-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0674",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.424774,
      "lng": 120.09844
    },
    "scale": 97.82,
    "height": 2.2,
    "yaw": 92,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598665272-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598665272; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598665272-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0675",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.424738,
      "lng": 120.098514
    },
    "scale": 84.4,
    "height": 2.3,
    "yaw": -53,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598665272-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598665272; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598665272-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0676",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.424791,
      "lng": 120.098527
    },
    "scale": 90.77,
    "height": 2.4,
    "yaw": 160,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598665272-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598665272; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598666207-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0677",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.4248,
      "lng": 120.098169
    },
    "scale": 97.72,
    "height": 1.8,
    "yaw": 18,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598666207-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598666207; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598666207-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0678",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.4247,
      "lng": 120.09816
    },
    "scale": 83.7,
    "height": 1.9,
    "yaw": -138,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598666207-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598666207; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598666207-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0679",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.424719,
      "lng": 120.09826
    },
    "scale": 89.47,
    "height": 1.9,
    "yaw": 64,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598666207-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598666207; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598666207-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0680",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.424783,
      "lng": 120.09822
    },
    "scale": 95.04,
    "height": 2,
    "yaw": -99,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598666207-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598666207; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598666835-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0681",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.424654,
      "lng": 120.098332
    },
    "scale": 81.18,
    "height": 2.1,
    "yaw": 104,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598666835-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598666835; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598666835-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0682",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.424566,
      "lng": 120.098415
    },
    "scale": 86.35,
    "height": 2.2,
    "yaw": -66,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598666835-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598666835; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598666835-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0683",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.42465,
      "lng": 120.09848
    },
    "scale": 91.32,
    "height": 2.2,
    "yaw": 121,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598666835-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598666835; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598666835-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0684",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.424678,
      "lng": 120.098384
    },
    "scale": 96.09,
    "height": 2.3,
    "yaw": -56,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598666835-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598666835; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598668004-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0685",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.424198,
      "lng": 120.098204
    },
    "scale": 81.4,
    "height": 2.3,
    "yaw": 132,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598668004-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598668004; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598668004-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0686",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.424182,
      "lng": 120.098347
    },
    "scale": 85.77,
    "height": 2.4,
    "yaw": -53,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598668004-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598668004; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598668004-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0687",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.424292,
      "lng": 120.098325
    },
    "scale": 89.94,
    "height": 2.4,
    "yaw": 119,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598668004-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598668004; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598668004-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0688",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.424252,
      "lng": 120.098219
    },
    "scale": 93.9,
    "height": 2.4,
    "yaw": -73,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598668004-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598668004; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598682959-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0689",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.424424,
      "lng": 120.102071
    },
    "scale": 78.4,
    "height": 2.4,
    "yaw": 101,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598682959-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598682959; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598682959-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0690",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.424503,
      "lng": 120.102195
    },
    "scale": 81.96,
    "height": 2.4,
    "yaw": -99,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598682959-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598682959; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598682959-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0691",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.424575,
      "lng": 120.102081
    },
    "scale": 85.32,
    "height": 2.4,
    "yaw": 59,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598682959-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598682959; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598682959-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0692",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.424474,
      "lng": 120.102032
    },
    "scale": 88.49,
    "height": 2.4,
    "yaw": -148,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598682959-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598682959; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598684232-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0693",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.424895,
      "lng": 120.102113
    },
    "scale": 92.17,
    "height": 2.4,
    "yaw": 10,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598684232-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598684232; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598684232-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0694",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.425034,
      "lng": 120.102139
    },
    "scale": 94.92,
    "height": 2.4,
    "yaw": 157,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598684232-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598684232; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598684232-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0695",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.425018,
      "lng": 120.101987
    },
    "scale": 97.48,
    "height": 2.3,
    "yaw": -61,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598684232-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598684232; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598684232-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0696",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.424906,
      "lng": 120.102038
    },
    "scale": 79.83,
    "height": 2.3,
    "yaw": 78,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598684232-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598684232; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598685226-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0697",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.424837,
      "lng": 120.104476
    },
    "scale": 82.69,
    "height": 2.2,
    "yaw": -139,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598685226-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598685226; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598685226-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0698",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.424857,
      "lng": 120.104444
    },
    "scale": 84.64,
    "height": 2.2,
    "yaw": -7,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598685226-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598685226; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598685226-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0699",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.424829,
      "lng": 120.104345
    },
    "scale": 86.39,
    "height": 2.1,
    "yaw": 120,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598685226-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598685226; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598685226-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0700",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.424774,
      "lng": 120.104482
    },
    "scale": 87.94,
    "height": 2,
    "yaw": -116,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598685226-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598685226; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598686166-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0701",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.425144,
      "lng": 120.104804
    },
    "scale": 89.98,
    "height": 1.9,
    "yaw": 13,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598686166-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598686166; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598686166-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0702",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.425151,
      "lng": 120.104733
    },
    "scale": 91.12,
    "height": 1.8,
    "yaw": 130,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598686166-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598686166; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598686166-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0703",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.425116,
      "lng": 120.104749
    },
    "scale": 92.07,
    "height": 1.7,
    "yaw": -117,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598686166-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598686166; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598686166-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0704",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.425096,
      "lng": 120.104851
    },
    "scale": 92.81,
    "height": 2.4,
    "yaw": -8,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598686166-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598686166; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598686882-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0705",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.425757,
      "lng": 120.104629
    },
    "scale": 94.03,
    "height": 2.3,
    "yaw": 105,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598686882-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598686882; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598686882-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0706",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.425711,
      "lng": 120.104554
    },
    "scale": 94.36,
    "height": 2.2,
    "yaw": -153,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598686882-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598686882; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598686882-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0707",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.425675,
      "lng": 120.104613
    },
    "scale": 94.5,
    "height": 2,
    "yaw": -54,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598686882-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598686882; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598686882-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0708",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.425713,
      "lng": 120.104621
    },
    "scale": 94.43,
    "height": 1.9,
    "yaw": 40,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598686882-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598686882; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598687937-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0709",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.426343,
      "lng": 120.103682
    },
    "scale": 94.83,
    "height": 1.8,
    "yaw": 139,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598687937-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598687937; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598687937-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0710",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.426253,
      "lng": 120.10366
    },
    "scale": 94.35,
    "height": 2.4,
    "yaw": -134,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598687937-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598687937; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598687937-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0711",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.426261,
      "lng": 120.103752
    },
    "scale": 93.68,
    "height": 2.2,
    "yaw": -50,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598687937-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598687937; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598687937-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0712",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.426318,
      "lng": 120.103724
    },
    "scale": 92.81,
    "height": 2,
    "yaw": 30,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598687937-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598687937; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598688788-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0713",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.426543,
      "lng": 120.102381
    },
    "scale": 92.38,
    "height": 1.9,
    "yaw": 113,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598688788-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598688788; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598688788-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0714",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.426454,
      "lng": 120.102446
    },
    "scale": 91.1,
    "height": 2.5,
    "yaw": -174,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598688788-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598688788; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598688788-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0715",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.426524,
      "lng": 120.102517
    },
    "scale": 89.62,
    "height": 2.3,
    "yaw": -105,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598688788-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598688788; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598688788-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0716",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.426558,
      "lng": 120.102435
    },
    "scale": 87.93,
    "height": 2.1,
    "yaw": -40,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598688788-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598688788; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598689639-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0717",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.426876,
      "lng": 120.102328
    },
    "scale": 86.68,
    "height": 1.9,
    "yaw": 28,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598689639-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598689639; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598689639-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0718",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.426847,
      "lng": 120.10246
    },
    "scale": 84.59,
    "height": 2.4,
    "yaw": 86,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598689639-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598689639; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598689639-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0719",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.426952,
      "lng": 120.102455
    },
    "scale": 82.3,
    "height": 2.2,
    "yaw": 140,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598689639-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598689639; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598689639-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0720",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.426925,
      "lng": 120.102352
    },
    "scale": 79.81,
    "height": 2,
    "yaw": -169,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598689639-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598689639; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598690339-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0721",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.427132,
      "lng": 120.102288
    },
    "scale": 97.74,
    "height": 1.7,
    "yaw": -116,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598690339-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598690339; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598690339-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0722",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.427194,
      "lng": 120.102417
    },
    "scale": 94.83,
    "height": 2.3,
    "yaw": -73,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598690339-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598690339; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598690339-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0723",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.427274,
      "lng": 120.10232
    },
    "scale": 91.73,
    "height": 2,
    "yaw": -33,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598690339-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598690339; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598690339-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0724",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.427185,
      "lng": 120.10226
    },
    "scale": 88.43,
    "height": 1.7,
    "yaw": 2,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598690339-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598690339; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598691106-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0725",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.426886,
      "lng": 120.102863
    },
    "scale": 85.53,
    "height": 2.2,
    "yaw": 41,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598691106-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598691106; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598691106-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0726",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.427016,
      "lng": 120.102908
    },
    "scale": 81.82,
    "height": 1.9,
    "yaw": 69,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598691106-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598691106; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598691106-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0727",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.427016,
      "lng": 120.102762
    },
    "scale": 97.91,
    "height": 2.4,
    "yaw": 94,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598691106-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598691106; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598691106-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0728",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.426906,
      "lng": 120.102793
    },
    "scale": 93.79,
    "height": 2.1,
    "yaw": 115,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598691106-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598691106; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598691756-1",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0729",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.426821,
      "lng": 120.103042
    },
    "scale": 90.07,
    "height": 1.8,
    "yaw": 138,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598691756-1; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598691756; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598691756-2",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0730",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.426915,
      "lng": 120.103042
    },
    "scale": 85.55,
    "height": 2.3,
    "yaw": 152,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598691756-2; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598691756; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598691756-3",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0731",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.426822,
      "lng": 120.102928
    },
    "scale": 80.82,
    "height": 2,
    "yaw": 162,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598691756-3; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598691756; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-dense_shrub_cluster-1781598691756-4",
    "zoneId": "manual-tier-3",
    "kind": "dense_shrub_cluster",
    "name": "手动树群 0732",
    "assetUrl": "/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb",
    "location": {
      "lat": 31.426756,
      "lng": 120.103049
    },
    "scale": 95.89,
    "height": 2.4,
    "yaw": 168,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-dense_shrub_cluster-1781598691756-4; originalSource=treeCandidateLab; clusterId=tree-lab-dense_shrub_cluster-1781598691756; clusterMode=smallCluster; candidateType=dense_shrub_cluster; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598697625-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0733",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.425268,
      "lng": 120.098615
    },
    "scale": 91.35,
    "height": 2.1,
    "yaw": 176,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598697625-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598697625; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598697625-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0734",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.425275,
      "lng": 120.098561
    },
    "scale": 86.01,
    "height": 1.7,
    "yaw": 175,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598697625-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598697625; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598697625-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0735",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.425192,
      "lng": 120.098507
    },
    "scale": 80.48,
    "height": 2.2,
    "yaw": 170,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598697625-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598697625; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598697625-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0736",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.425218,
      "lng": 120.098659
    },
    "scale": 94.74,
    "height": 1.8,
    "yaw": 162,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598697625-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598697625; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598698291-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0737",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.425026,
      "lng": 120.098914
    },
    "scale": 89.36,
    "height": 2.2,
    "yaw": 155,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598698291-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598698291; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598698291-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0738",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.424993,
      "lng": 120.098846
    },
    "scale": 83.22,
    "height": 1.8,
    "yaw": 139,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598698291-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598698291; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598698291-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0739",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.424963,
      "lng": 120.098889
    },
    "scale": 96.87,
    "height": 2.2,
    "yaw": 120,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598698291-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598698291; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598698291-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0740",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.425007,
      "lng": 120.098987
    },
    "scale": 90.32,
    "height": 1.8,
    "yaw": 96,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598698291-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598698291; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598700714-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0741",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.42462,
      "lng": 120.101542
    },
    "scale": 84.12,
    "height": 2.2,
    "yaw": 75,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598700714-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598700714; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598700714-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0742",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.42454,
      "lng": 120.101511
    },
    "scale": 97.16,
    "height": 1.8,
    "yaw": 44,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598700714-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598700714; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598700714-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0743",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.42454,
      "lng": 120.101591
    },
    "scale": 89.99,
    "height": 2.2,
    "yaw": 10,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598700714-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598700714; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598700714-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0744",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.424585,
      "lng": 120.101573
    },
    "scale": 82.63,
    "height": 1.7,
    "yaw": -29,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598700714-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598700714; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598701372-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0745",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.424061,
      "lng": 120.101379
    },
    "scale": 95.6,
    "height": 2.1,
    "yaw": -65,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598701372-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598701372; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598701372-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0746",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423973,
      "lng": 120.101427
    },
    "scale": 87.83,
    "height": 2.4,
    "yaw": -111,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598701372-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598701372; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598701372-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0747",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.424029,
      "lng": 120.1015
    },
    "scale": 79.85,
    "height": 2,
    "yaw": -160,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598701372-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598701372; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598701372-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0748",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.424065,
      "lng": 120.101433
    },
    "scale": 91.67,
    "height": 2.3,
    "yaw": 147,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598701372-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598701372; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598702508-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0749",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.42328,
      "lng": 120.100582
    },
    "scale": 83.82,
    "height": 1.8,
    "yaw": 96,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598702508-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598702508; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598702508-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0750",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.42324,
      "lng": 120.1007
    },
    "scale": 95.23,
    "height": 2.1,
    "yaw": 35,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598702508-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598702508; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598702508-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0751",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423336,
      "lng": 120.10071
    },
    "scale": 86.44,
    "height": 2.4,
    "yaw": -29,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598702508-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598702508; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598702508-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0752",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423323,
      "lng": 120.100614
    },
    "scale": 97.44,
    "height": 1.9,
    "yaw": -96,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598702508-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598702508; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598703291-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0753",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.422601,
      "lng": 120.100669
    },
    "scale": 88.76,
    "height": 2.2,
    "yaw": -163,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598703291-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598703291; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598703291-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0754",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.422647,
      "lng": 120.100798
    },
    "scale": 79.36,
    "height": 1.7,
    "yaw": 122,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598703291-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598703291; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598703291-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0755",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.422731,
      "lng": 120.100719
    },
    "scale": 89.75,
    "height": 2,
    "yaw": 43,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598703291-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598703291; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598703291-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0756",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.422656,
      "lng": 120.100651
    },
    "scale": 79.95,
    "height": 2.2,
    "yaw": -39,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598703291-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598703291; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598704357-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0757",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423347,
      "lng": 120.102158
    },
    "scale": 90.44,
    "height": 1.7,
    "yaw": -121,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598704357-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598704357; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598704357-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0758",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423465,
      "lng": 120.102219
    },
    "scale": 80.22,
    "height": 2,
    "yaw": 149,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598704357-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598704357; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598704357-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0759",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423481,
      "lng": 120.102082
    },
    "scale": 89.8,
    "height": 2.2,
    "yaw": 55,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598704357-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598704357; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598704357-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0760",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423375,
      "lng": 120.102095
    },
    "scale": 79.17,
    "height": 2.4,
    "yaw": -42,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598704357-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598704357; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598705156-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0761",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.42367,
      "lng": 120.101506
    },
    "scale": 88.83,
    "height": 1.9,
    "yaw": -139,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598705156-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598705156; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598705156-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0762",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.4238,
      "lng": 120.10145
    },
    "scale": 97.8,
    "height": 2.1,
    "yaw": 117,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598705156-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598705156; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598705156-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0763",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423724,
      "lng": 120.10133
    },
    "scale": 86.56,
    "height": 2.3,
    "yaw": 8,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598705156-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598705156; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598705156-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0764",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423649,
      "lng": 120.101433
    },
    "scale": 95.12,
    "height": 2.5,
    "yaw": -104,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598705156-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598705156; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598706156-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0765",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423975,
      "lng": 120.102972
    },
    "scale": 83.95,
    "height": 1.9,
    "yaw": 144,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598706156-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598706156; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598706156-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0766",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.424051,
      "lng": 120.102895
    },
    "scale": 92.1,
    "height": 2.1,
    "yaw": 25,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598706156-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598706156; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598706156-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0767",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423916,
      "lng": 120.102868
    },
    "scale": 80.05,
    "height": 2.2,
    "yaw": -98,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598706156-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598706156; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598706156-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0768",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423923,
      "lng": 120.103014
    },
    "scale": 87.79,
    "height": 2.4,
    "yaw": 135,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598706156-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598706156; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598707076-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0769",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423786,
      "lng": 120.103593
    },
    "scale": 95.79,
    "height": 1.8,
    "yaw": 8,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598707076-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598707076; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598707076-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0770",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423763,
      "lng": 120.103534
    },
    "scale": 83.13,
    "height": 1.9,
    "yaw": -126,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598707076-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598707076; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598707076-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0771",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423665,
      "lng": 120.103555
    },
    "scale": 90.26,
    "height": 2,
    "yaw": 96,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598707076-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598707076; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598707076-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0772",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423763,
      "lng": 120.103663
    },
    "scale": 97.18,
    "height": 2.2,
    "yaw": -46,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598707076-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598707076; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598707891-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0773",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.424068,
      "lng": 120.103497
    },
    "scale": 84.35,
    "height": 2.3,
    "yaw": 172,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598707891-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598707891; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598707891-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0774",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.424001,
      "lng": 120.103461
    },
    "scale": 90.87,
    "height": 2.4,
    "yaw": 23,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598707891-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598707891; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598707891-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0775",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423996,
      "lng": 120.103526
    },
    "scale": 97.18,
    "height": 1.7,
    "yaw": -130,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598707891-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598707891; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598707891-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0776",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.424087,
      "lng": 120.103572
    },
    "scale": 83.29,
    "height": 1.8,
    "yaw": 74,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598707891-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598707891; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598709685-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0777",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.426523,
      "lng": 120.104007
    },
    "scale": 89.63,
    "height": 1.9,
    "yaw": -83,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598709685-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598709685; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598709685-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0778",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.426439,
      "lng": 120.104039
    },
    "scale": 95.33,
    "height": 2,
    "yaw": 113,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598709685-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598709685; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598709685-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0779",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.426482,
      "lng": 120.10411
    },
    "scale": 80.82,
    "height": 2.1,
    "yaw": -55,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598709685-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598709685; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598709685-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0780",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.426516,
      "lng": 120.104058
    },
    "scale": 86.12,
    "height": 2.1,
    "yaw": 134,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598709685-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598709685; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598715158-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0781",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.425694,
      "lng": 120.096598
    },
    "scale": 91.62,
    "height": 2.2,
    "yaw": -38,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598715158-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598715158; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598715158-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0782",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.425646,
      "lng": 120.096702
    },
    "scale": 96.5,
    "height": 2.3,
    "yaw": 143,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598715158-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598715158; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598715158-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0783",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.425732,
      "lng": 120.096724
    },
    "scale": 81.18,
    "height": 2.3,
    "yaw": -40,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598715158-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598715158; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598715158-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0784",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.425729,
      "lng": 120.096638
    },
    "scale": 85.65,
    "height": 2.3,
    "yaw": 134,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598715158-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598715158; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598717313-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0785",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.429122,
      "lng": 120.097767
    },
    "scale": 90.33,
    "height": 2.4,
    "yaw": -53,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598717313-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598717313; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598717313-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0786",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.429152,
      "lng": 120.097894
    },
    "scale": 94.39,
    "height": 2.4,
    "yaw": 114,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598717313-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598717313; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598717313-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0787",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.429237,
      "lng": 120.097833
    },
    "scale": 78.25,
    "height": 2.4,
    "yaw": -84,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598717313-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598717313; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598717313-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0788",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.429176,
      "lng": 120.097761
    },
    "scale": 81.91,
    "height": 2.4,
    "yaw": 75,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598717313-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598717313; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598719107-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0789",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.429376,
      "lng": 120.096408
    },
    "scale": 85.75,
    "height": 2.4,
    "yaw": -127,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598719107-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598719107; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598719107-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0790",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.429481,
      "lng": 120.096482
    },
    "scale": 88.99,
    "height": 2.4,
    "yaw": 25,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598719107-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598719107; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598719107-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0791",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.42951,
      "lng": 120.096356
    },
    "scale": 92.03,
    "height": 2.3,
    "yaw": 173,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598719107-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598719107; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598719107-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0792",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.429412,
      "lng": 120.096352
    },
    "scale": 94.87,
    "height": 2.3,
    "yaw": -43,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598719107-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598719107; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598720427-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0793",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.429486,
      "lng": 120.094354
    },
    "scale": 97.88,
    "height": 2.3,
    "yaw": 100,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598720427-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598720427; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598720427-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0794",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.429614,
      "lng": 120.09432
    },
    "scale": 80.3,
    "height": 2.2,
    "yaw": -124,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598720427-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598720427; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598720427-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0795",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.429556,
      "lng": 120.094195
    },
    "scale": 82.52,
    "height": 2.2,
    "yaw": 9,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598720427-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598720427; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598720427-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0796",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.429475,
      "lng": 120.09428
    },
    "scale": 84.54,
    "height": 2.1,
    "yaw": 139,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598720427-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598720427; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598721477-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0797",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.429155,
      "lng": 120.094165
    },
    "scale": 86.72,
    "height": 2,
    "yaw": -93,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598721477-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598721477; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598721477-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0798",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.429236,
      "lng": 120.094123
    },
    "scale": 88.32,
    "height": 2,
    "yaw": 28,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598721477-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598721477; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598721477-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0799",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.429112,
      "lng": 120.094077
    },
    "scale": 89.72,
    "height": 1.9,
    "yaw": 147,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598721477-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598721477; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598721477-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0800",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.429102,
      "lng": 120.094216
    },
    "scale": 90.92,
    "height": 1.8,
    "yaw": -99,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598721477-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598721477; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598722513-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0801",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.428835,
      "lng": 120.094904
    },
    "scale": 92.27,
    "height": 2.5,
    "yaw": 14,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598722513-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598722513; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598722513-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0802",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.428818,
      "lng": 120.094865
    },
    "scale": 93.05,
    "height": 2.3,
    "yaw": 121,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598722513-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598722513; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598722513-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0803",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.428728,
      "lng": 120.094856
    },
    "scale": 93.63,
    "height": 2.2,
    "yaw": -136,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598722513-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598722513; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598722513-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0804",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.428809,
      "lng": 120.094973
    },
    "scale": 94.01,
    "height": 2.1,
    "yaw": -36,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598722513-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598722513; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598724266-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0805",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.42344,
      "lng": 120.099979
    },
    "scale": 94.52,
    "height": 2,
    "yaw": 62,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598724266-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598724266; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598724266-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0806",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423386,
      "lng": 120.099943
    },
    "scale": 94.48,
    "height": 1.8,
    "yaw": 154,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598724266-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598724266; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598724266-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0807",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423383,
      "lng": 120.099989
    },
    "scale": 94.24,
    "height": 2.5,
    "yaw": -118,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598724266-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598724266; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598724266-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0808",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423453,
      "lng": 120.100054
    },
    "scale": 93.8,
    "height": 2.3,
    "yaw": -33,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598724266-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598724266; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598725660-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0809",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.421753,
      "lng": 120.100887
    },
    "scale": 93.48,
    "height": 2.1,
    "yaw": 50,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598725660-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598725660; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598725660-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0810",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.421675,
      "lng": 120.100905
    },
    "scale": 92.62,
    "height": 1.9,
    "yaw": 127,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598725660-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598725660; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598725660-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0811",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.421706,
      "lng": 120.100969
    },
    "scale": 91.56,
    "height": 1.8,
    "yaw": -159,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598725660-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598725660; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598725660-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0812",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.421729,
      "lng": 120.100932
    },
    "scale": 90.3,
    "height": 2.4,
    "yaw": -89,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598725660-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598725660; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598726581-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0813",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.42151,
      "lng": 120.101717
    },
    "scale": 89.14,
    "height": 2.2,
    "yaw": -22,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598726581-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598726581; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598726581-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0814",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.421456,
      "lng": 120.101806
    },
    "scale": 87.46,
    "height": 1.9,
    "yaw": 41,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598726581-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598726581; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598726581-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0815",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.421531,
      "lng": 120.101836
    },
    "scale": 85.58,
    "height": 1.7,
    "yaw": 100,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598726581-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598726581; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598726581-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0816",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.421535,
      "lng": 120.101764
    },
    "scale": 83.5,
    "height": 2.3,
    "yaw": 155,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598726581-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598726581; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598727490-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0817",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.42207,
      "lng": 120.102736
    },
    "scale": 81.5,
    "height": 2.1,
    "yaw": -153,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598727490-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598727490; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598727490-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0818",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.422085,
      "lng": 120.102858
    },
    "scale": 79,
    "height": 1.8,
    "yaw": -105,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598727490-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598727490; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598727490-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0819",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.422169,
      "lng": 120.102814
    },
    "scale": 96.3,
    "height": 2.4,
    "yaw": -61,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598727490-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598727490; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598727490-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0820",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.422122,
      "lng": 120.102742
    },
    "scale": 93.4,
    "height": 2.1,
    "yaw": -21,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598727490-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598727490; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598728240-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0821",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.422384,
      "lng": 120.103023
    },
    "scale": 90.57,
    "height": 1.8,
    "yaw": 17,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598728240-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598728240; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598728240-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0822",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.422475,
      "lng": 120.103106
    },
    "scale": 87.25,
    "height": 2.3,
    "yaw": 50,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598728240-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598728240; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598728240-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0823",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.422515,
      "lng": 120.102994
    },
    "scale": 83.73,
    "height": 2.1,
    "yaw": 79,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598728240-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598728240; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598728240-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0824",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.422425,
      "lng": 120.102976
    },
    "scale": 80,
    "height": 1.8,
    "yaw": 104,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598728240-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598728240; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598729575-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0825",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423192,
      "lng": 120.103292
    },
    "scale": 96.33,
    "height": 2.3,
    "yaw": 126,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598729575-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598729575; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598729575-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0826",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423317,
      "lng": 120.103277
    },
    "scale": 92.19,
    "height": 1.9,
    "yaw": 144,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598729575-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598729575; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598729575-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0827",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423276,
      "lng": 120.103152
    },
    "scale": 87.85,
    "height": 2.4,
    "yaw": 159,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598729575-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598729575; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598729575-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0828",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423191,
      "lng": 120.103219
    },
    "scale": 83.3,
    "height": 2.1,
    "yaw": 169,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598729575-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598729575; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598731443-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0829",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423824,
      "lng": 120.105095
    },
    "scale": 78.8,
    "height": 1.8,
    "yaw": 177,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598731443-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598731443; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598731443-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0830",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423911,
      "lng": 120.104975
    },
    "scale": 93.83,
    "height": 2.2,
    "yaw": 180,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598731443-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598731443; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598731443-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0831",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423799,
      "lng": 120.104913
    },
    "scale": 88.67,
    "height": 1.9,
    "yaw": 179,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598731443-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598731443; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598731443-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0832",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.423775,
      "lng": 120.105042
    },
    "scale": 83.3,
    "height": 2.3,
    "yaw": 175,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598731443-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598731443; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598733326-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0833",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.426202,
      "lng": 120.100958
    },
    "scale": 97.96,
    "height": 1.9,
    "yaw": 167,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598733326-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598733326; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598733326-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0834",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.426239,
      "lng": 120.100856
    },
    "scale": 92.17,
    "height": 2.3,
    "yaw": 155,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598733326-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598733326; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598733326-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0835",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.426112,
      "lng": 120.100905
    },
    "scale": 86.18,
    "height": 2,
    "yaw": 140,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598733326-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598733326; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598733326-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0836",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.426176,
      "lng": 120.101028
    },
    "scale": 79.99,
    "height": 2.4,
    "yaw": 121,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598733326-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598733326; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598734545-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0837",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.42652,
      "lng": 120.100301
    },
    "scale": 93.82,
    "height": 2,
    "yaw": 98,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598734545-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598734545; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598734545-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0838",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.42648,
      "lng": 120.10027
    },
    "scale": 87.21,
    "height": 2.4,
    "yaw": 72,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598734545-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598734545; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598734545-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0839",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.426403,
      "lng": 120.100336
    },
    "scale": 80.4,
    "height": 1.9,
    "yaw": 41,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598734545-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598734545; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598734545-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0840",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.42653,
      "lng": 120.100376
    },
    "scale": 93.38,
    "height": 2.3,
    "yaw": 8,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598734545-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598734545; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598735498-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0841",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.426614,
      "lng": 120.100724
    },
    "scale": 86.37,
    "height": 1.9,
    "yaw": -31,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598735498-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598735498; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598735498-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0842",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.426546,
      "lng": 120.100732
    },
    "scale": 78.94,
    "height": 2.2,
    "yaw": -72,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598735498-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598735498; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598735498-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0843",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.426567,
      "lng": 120.100783
    },
    "scale": 91.31,
    "height": 1.8,
    "yaw": -117,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598735498-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598735498; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598735498-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0844",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.426661,
      "lng": 120.10078
    },
    "scale": 83.47,
    "height": 2.1,
    "yaw": -166,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598735498-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598735498; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598736520-1",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0845",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.426713,
      "lng": 120.101286
    },
    "scale": 95.62,
    "height": 2.4,
    "yaw": 141,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598736520-1; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598736520; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598736520-2",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0846",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.426657,
      "lng": 120.10136
    },
    "scale": 87.37,
    "height": 2,
    "yaw": 85,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598736520-2; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598736520; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598736520-3",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0847",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.426719,
      "lng": 120.101394
    },
    "scale": 78.91,
    "height": 2.3,
    "yaw": 25,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598736520-3; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598736520; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-soft_forest_clump-1781598736520-4",
    "zoneId": "manual-tier-3",
    "kind": "soft_forest_clump",
    "name": "手动树群 0848",
    "assetUrl": "/models/lingshan/tree-candidates/soft-forest-clump-a.glb",
    "location": {
      "lat": 31.426724,
      "lng": 120.101338
    },
    "scale": 90.25,
    "height": 1.8,
    "yaw": -38,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-soft_forest_clump-1781598736520-4; originalSource=treeCandidateLab; clusterId=tree-lab-soft_forest_clump-1781598736520; clusterMode=smallCluster; candidateType=soft_forest_clump; tier=3."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598748440-1",
    "zoneId": "manual-tier-3",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0849",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.423394,
      "lng": 120.095507
    },
    "scale": 0.82,
    "height": 0,
    "yaw": -107,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598748440-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598748440; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=3."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598748440-2",
    "zoneId": "manual-tier-3",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0850",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.423397,
      "lng": 120.095667
    },
    "scale": 1.04,
    "height": 0.3,
    "yaw": -178,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598748440-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598748440; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=3."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598748440-3",
    "zoneId": "manual-tier-3",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0851",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.423509,
      "lng": 120.095627
    },
    "scale": 0.85,
    "height": -0.2,
    "yaw": 108,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598748440-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598748440; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=3."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598749802-1",
    "zoneId": "manual-tier-3",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0852",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.42317,
      "lng": 120.096144
    },
    "scale": 1.07,
    "height": 0,
    "yaw": 28,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598749802-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598749802; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=3."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598749802-2",
    "zoneId": "manual-tier-3",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0853",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.423277,
      "lng": 120.096271
    },
    "scale": 0.87,
    "height": 0.3,
    "yaw": -54,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598749802-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598749802; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=3."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598749802-3",
    "zoneId": "manual-tier-3",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0854",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.423344,
      "lng": 120.096134
    },
    "scale": 1.08,
    "height": -0.2,
    "yaw": -140,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598749802-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598749802; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=3."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598750989-1",
    "zoneId": "manual-tier-3",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0855",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.423302,
      "lng": 120.098966
    },
    "scale": 0.88,
    "height": 0,
    "yaw": 129,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598750989-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598750989; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=3."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598750989-2",
    "zoneId": "manual-tier-3",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0856",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.423469,
      "lng": 120.098971
    },
    "scale": 1.07,
    "height": 0.2,
    "yaw": 36,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598750989-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598750989; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=3."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598750989-3",
    "zoneId": "manual-tier-3",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0857",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.423434,
      "lng": 120.0988
    },
    "scale": 0.86,
    "height": -0.3,
    "yaw": -61,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598750989-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598750989; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=3."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598752292-1",
    "zoneId": "manual-tier-3",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0858",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.421887,
      "lng": 120.100855
    },
    "scale": 1.05,
    "height": -0.1,
    "yaw": -164,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598752292-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598752292; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=3."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598752292-2",
    "zoneId": "manual-tier-3",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0859",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.42202,
      "lng": 120.100713
    },
    "scale": 0.83,
    "height": 0.1,
    "yaw": 92,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598752292-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598752292; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=3."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598752292-3",
    "zoneId": "manual-tier-3",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0860",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.421882,
      "lng": 120.100608
    },
    "scale": 1.01,
    "height": 0.3,
    "yaw": -16,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598752292-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598752292; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=3."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598753327-1",
    "zoneId": "manual-tier-3",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0861",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.421685,
      "lng": 120.10124
    },
    "scale": 0.78,
    "height": -0.3,
    "yaw": -130,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598753327-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598753327; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=3."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598753327-2",
    "zoneId": "manual-tier-3",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0862",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.421698,
      "lng": 120.101015
    },
    "scale": 0.95,
    "height": -0.1,
    "yaw": 115,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598753327-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598753327; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=3."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598753327-3",
    "zoneId": "manual-tier-3",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0863",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.421523,
      "lng": 120.101055
    },
    "scale": 1.12,
    "height": 0.1,
    "yaw": -5,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598753327-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598753327; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=3."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598754843-1",
    "zoneId": "manual-tier-3",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0864",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.42105,
      "lng": 120.1023
    },
    "scale": 0.88,
    "height": 0.3,
    "yaw": -130,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598754843-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598754843; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=3."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598754843-2",
    "zoneId": "manual-tier-3",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0865",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.421009,
      "lng": 120.102143
    },
    "scale": 1.04,
    "height": -0.4,
    "yaw": 104,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598754843-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598754843; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=3."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598754843-3",
    "zoneId": "manual-tier-3",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0866",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.420899,
      "lng": 120.102325
    },
    "scale": 0.79,
    "height": -0.2,
    "yaw": -27,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598754843-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598754843; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=3."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598757866-1",
    "zoneId": "manual-tier-3",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0867",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426187,
      "lng": 120.101169
    },
    "scale": 0.94,
    "height": -0.1,
    "yaw": -163,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598757866-1; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598757866; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=3."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598757866-2",
    "zoneId": "manual-tier-3",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0868",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426109,
      "lng": 120.10117
    },
    "scale": 1.09,
    "height": 0.1,
    "yaw": 59,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598757866-2; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598757866; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=3."
  },
  {
    "id": "tree-lab-fluffy_bodhi_grove-1781598757866-3",
    "zoneId": "manual-tier-3",
    "kind": "fluffy_bodhi_grove",
    "name": "手动树群 0869",
    "assetUrl": "/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb",
    "location": {
      "lat": 31.426073,
      "lng": 120.101329
    },
    "scale": 0.83,
    "height": 0.2,
    "yaw": -82,
    "opacity": 0.92,
    "visible": true,
    "priority": "low",
    "routeFraction": 0,
    "licenseId": "manual-tree-candidates-runtime-v1",
    "note": "source=manualTreeAssets; originalId=tree-lab-fluffy_bodhi_grove-1781598757866-3; originalSource=treeCandidateLab; clusterId=tree-lab-fluffy_bodhi_grove-1781598757866; clusterMode=smallCluster; candidateType=fluffy_bodhi_grove; tier=3."
  }
] satisfies LingshanMap3DGardenAsset[]

export const LINGSHAN_MANUAL_TREE_ASSETS = LINGSHAN_MANUAL_TREE_ASSETS_RAW.map(normalizeLingshanTreeAssetScale) satisfies LingshanMap3DGardenAsset[]

export const LINGSHAN_MANUAL_TREE_ASSET_STATS = {
  "total": 869,
  "high": 200,
  "fluffy_round_tree": 173,
  "fluffy_bodhi_grove": 224,
  "medium": 300,
  "fluffy_tree_mix": 60,
  "bushy_canopy_tree": 172,
  "low": 369,
  "dense_shrub_cluster": 124,
  "soft_forest_clump": 116
} as const
