const API_URL=(import.meta.env.VITE_API_URL||'http://localhost:5000/api').replace(/\/$/,'');
export async function api(path,{token,...options}={}){
 const res=await fetch(`${API_URL}${path}`,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{ }),...(options.headers||{})}});
 const data=await res.json().catch(()=>({message:'Unexpected server response.'}));
 if(!res.ok) throw new Error(data.message||`Request failed (${res.status})`);
 return data;
}
export const apiUrl=API_URL;
