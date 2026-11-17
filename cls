warning: in the working copy of 'client/src/api/client.js', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'client/src/pages/Manage/Manage.jsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'server/package-lock.json', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'server/package.json', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'server/src/routes/group.routes.js', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/client/src/api/client.js b/client/src/api/client.js[m
[1mindex 7313826..2b89256 100644[m
[1m--- a/client/src/api/client.js[m
[1m+++ b/client/src/api/client.js[m
[36m@@ -105,10 +105,18 @@[m [mexport async function api(path, options = {}) {[m
     throw error;[m
   }[m
 [m
[32m+[m[32m  // if ([m
[32m+[m[32m  //   type.includes("text/csv") ||[m
[32m+[m[32m  //   type.includes("spreadsheetml") ||[m
[32m+[m[32m  //   type.includes("application/octet-stream")[m
[32m+[m[32m  // ) {[m
[32m+[m[32m  //   return res.blob();[m
[32m+[m[32m  // }[m
   if ([m
     type.includes("text/csv") ||[m
     type.includes("spreadsheetml") ||[m
[31m-    type.includes("application/octet-stream")[m
[32m+[m[32m    type.includes("application/octet-stream") ||[m
[32m+[m[32m    type.includes("application/pdf")[m
   ) {[m
     return res.blob();[m
   }[m
[1mdiff --git a/client/src/pages/Manage/Manage.jsx b/client/src/pages/Manage/Manage.jsx[m
[1mindex 06bdad6..4e60e65 100644[m
[1m--- a/client/src/pages/Manage/Manage.jsx[m
[1m+++ b/client/src/pages/Manage/Manage.jsx[m
[36m@@ -27,6 +27,7 @@[m [mimport {[m
   Clock3,[m
   Check,[m
   AlertTriangle,[m
[32m+[m[32m  FileText,[m
 } from "lucide-react";[m
 import { api, saveBlob } from "../../api/client";[m
 import { useToast } from "../../components/Toast/Toast";[m
[36m@@ -39,8 +40,7 @@[m [mimport Promos from "../Promos/Promos";[m
 import RewardsPage from "../RewardsPage/RewardsPage";[m
 import CertificatePage from "../Certificate/CertificatePage";[m
 import ApprovalsPage from "../admin/pages/ApprovalsPage/ApprovalsPage";[m
[31m-// import ApprovalsPage from "./ApprovalsPage/ApprovalsPage";[m
[31m-// import ApprovalsPage from "./ApprovalsPage/"[m
[32m+[m[32mimport LORGenerator from "./components/LORGenerator/LORGenerator";[m
 [m
 const blankGroup = {[m
   name: "",[m
[36m@@ -61,6 +61,7 @@[m [mexport default function Manage({ user }) {[m
   const [walletInterns, setWalletInterns] = useState([]);[m
   const [walletInternSearch, setWalletInternSearch] = useState("");[m
   const [walletDetailIntern, setWalletDetailIntern] = useState(null);[m
[32m+[m[32m  const [lorGroup, setLorGroup] = useState(null);[m
   const [data, setData] = useState([]),[m
     [groups, setGroups] = useState([]),[m
     [loading, setLoading] = useState(true),[m
[36m@@ -818,6 +819,13 @@[m [mexport default function Manage({ user }) {[m
                       <Download size={14} /> Export full CSV[m
                     </button>[m
                   )}[m
[32m+[m[32m                  <button[m
[32m+[m[32m                    onClick={() => setLorGroup(g)}[m
[32m+[m[32m                    title="Generate Letter of Recommendation selection list"[m
[32m+[m[32m                  >[m
[32m+[m[32m                    <FileText size={14} />[m
[32m+[m[32m                    Generate LOR List[m
[32m+[m[32m                  </button>[m
                   <div[m
                     className={`flex gap-3 mt-1 md:w-full justify-center ${styles.actionCont} `}[m
                   >[m
[36m@@ -851,6 +859,13 @@[m [mexport default function Manage({ user }) {[m
         {groups.length === 0 && ([m
           <Empty text="No groups yet. Create your first group to generate a secure registration link." />[m
         )}[m
[32m+[m[32m        {lorGroup && ([m
[32m+[m[32m          <LORGenerator[m
[32m+[m[32m            group={lorGroup}[m
[32m+[m[32m            onClose={() => setLorGroup(null)}[m
[32m+[m[32m            onSuccess={() => setLorGroup(null)}[m
[32m+[m[32m          />[m
[32m+[m[32m        )}[m
         {modal === "group" && ([m
           <Modal[m
             title={editing ? "Edit group details" : "Create internship group"}[m
[1mdiff --git a/server/package-lock.json b/server/package-lock.json[m
[1mindex c591721..6d4ce99 100644[m
[1m--- a/server/package-lock.json[m
[1m+++ b/server/package-lock.json[m
[36m@@ -8,6 +8,7 @@[m
       "name": "veloop-intern-attendance-api",[m
       "version": "1.0.0",[m
       "dependencies": {[m
[32m+[m[32m        "@pdf-lib/fontkit": "^1.1.1",[m
         "bcryptjs": "^2.4.3",[m
         "cors": "^2.8.5",[m
         "dotenv": "^16.4.7",[m
[36m@@ -19,6 +20,7 @@[m
         "jsonwebtoken": "^9.0.2",[m
         "mongoose": "^8.9.5",[m
         "morgan": "^1.10.0",[m
[32m+[m[32m        "pdf-lib": "^1.17.1",[m
         "zod": "^3.24.1"[m
       },[m
       "engines": {[m
[36m@@ -63,6 +65,33 @@[m
         "sparse-bitfield": "^3.0.3"[m
       }[m
     },[m
[32m+[m[32m    "node_modules/@pdf-lib/fontkit": {[m
[32m+[m[32m      "version": "1.1.1",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/@pdf-lib/fontkit/-/fontkit-1.1.1.tgz",[m
[32m+[m[32m      "integrity": "sha512-KjMd7grNapIWS/Dm0gvfHEilSyAmeLvrEGVcqLGi0VYebuqqzTbgF29efCx7tvx+IEbG3zQciRSWl3GkUSvjZg==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "pako": "^1.0.6"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
[32m+[m[32m    "node_modules/@pdf-lib/standard-fonts": {[m
[32m+[m[32m      "version": "1.0.0",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/@pdf-lib/standard-fonts/-/standard-fonts-1.0.0.tgz",[m
[32m+[m[32m      "integrity": "sha512-hU30BK9IUN/su0Mn9VdlVKsWBS6GyhVfqjwl1FjZN4TxP6cCw0jP2w7V3Hf5uX7M0AZJ16vey9yE0ny7Sa59ZA==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "pako": "^1.0.6"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
[32m+[m[32m    "node_modules/@pdf-lib/upng": {[m
[32m+[m[32m      "version": "1.0.1",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/@pdf-lib/upng/-/upng-1.0.1.tgz",[m
[32m+[m[32m      "integrity": "sha512-dQK2FUMQtowVP00mtIksrlZhdFXQZPC+taih1q4CvPZ5vqdxR/LKBaFg0oAfzd1GlHZXXSPdQfzQnt+ViGvEIQ==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "pako": "^1.0.10"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "node_modules/@types/node": {[m
       "version": "14.18.63",[m
       "resolved": "https://registry.npmjs.org/@types/node/-/node-14.18.63.tgz",[m
[36m@@ -2758,6 +2787,18 @@[m
       "integrity": "sha512-A/AGNMFN3c8bOlvV9RreMdrv7jsmF9XIfDeCd87+I8RNg6s78BhJxMu69NEMHBSJFxKidViTEdruRwEk/WIKqA==",[m
       "license": "MIT"[m
     },[m
[32m+[m[32m    "node_modules/pdf-lib": {[m
[32m+[m[32m      "version": "1.17.1",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/pdf-lib/-/pdf-lib-1.17.1.tgz",[m
[32m+[m[32m      "integrity": "sha512-V/mpyJAoTsN4cnP31vc0wfNA1+p20evqqnap0KLoRUN0Yk/p3wN52DOEsL4oBFcLdb76hlpKPtzJIgo67j/XLw==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "@pdf-lib/standard-fonts": "^1.0.0",[m
[32m+[m[32m        "@pdf-lib/upng": "^1.0.1",[m
[32m+[m[32m        "pako": "^1.0.11",[m
[32m+[m[32m        "tslib": "^1.11.1"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "node_modules/possible-typed-array-names": {[m
       "version": "1.1.0",[m
       "resolved": "https://registry.npmjs.org/possible-typed-array-names/-/possible-typed-array-names-1.1.0.tgz",[m
[36m@@ -3377,6 +3418,12 @@[m
         "url": "https://github.com/sponsors/ljharb"[m
       }[m
     },[m
[32m+[m[32m    "node_modules/tslib": {[m
[32m+[m[32m      "version": "1.14