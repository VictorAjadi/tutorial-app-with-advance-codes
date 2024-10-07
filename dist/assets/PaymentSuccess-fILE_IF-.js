import{R as p,Q as x,f as h,S as g,r as l,j as e,L as f,_ as t,T as y}from"./index-u5watr16.js";const w=()=>{const d=x(),n=h(),{courseId:s}=g(),[i,a]=l.useState("processing"),r=new URLSearchParams(d.search).get("token");l.useEffect(()=>{r&&(async()=>{const o=t.loading("Capturing payment...");try{const c=await y(r,{courseId:s});if(t.remove(o),c.status==="success")return a("completed"),t.success("Payment captured successfully!"),n(`/courses/details/${s}`);c.status==="error"&&(a("failed"),t.error("Payment was unsuccessful!"))}catch{t.remove(o),a("failed"),t.error("An unexpected error occurred while capturing payment.")}})()},[r,s,n]);const u=()=>{switch(i){case"processing":return e.jsxs("div",{className:"loader",style:{marginBottom:"100px"},children:[e.jsx("div",{}),e.jsx("div",{}),e.jsx("div",{}),e.jsx("div",{})]});case"failed":return e.jsx("svg",{height:"100px",width:"100px",viewBox:"-1.12 -1.12 16.24 16.24",className:"rotate-left my-5 mx-auto d-flex justigy-content-center align-items-center",xmlns:"http://www.w3.org/2000/svg",fill:"#dc3545",stroke:"#dc3545",strokeWidth:"0.56",children:e.jsxs("g",{fillRule:"evenodd",children:[e.jsx("path",{d:"M0 7a7 7 0 1 1 14 0A7 7 0 0 1 0 7z"}),e.jsx("path",{d:"M13 7A6 6 0 1 0 1 7a6 6 0 0 0 12 0z",fill:"#FFF"}),e.jsx("path",{d:"M7 5.969L5.599 4.568a.29.29 0 0 0-.413.004l-.614.614a.294.294 0 0 0-.004.413L5.968 7l-1.4 1.401a.29.29 0 0 0 .004.413l.614.614c.113.114.3.117.413.004L7 8.032l1.401 1.4a.29.29 0 0 0 .413-.004l.614-.614a.294.294 0 0 0 .004-.413L8.032 7l1.4-1.401a.29.29 0 0 0-.004-.413l-.614-.614a.294.294 0 0 0-.413-.004L7 5.968z"})]})});case"completed":return e.jsx("svg",{fill:"#198754",height:"100px",width:"100px",className:"rotate-left my-5 mx-auto d-flex justigy-content-center align-items-center",viewBox:"-2.08 -2.08 20.16 20.16",xmlns:"http://www.w3.org/2000/svg",stroke:"#198754",strokeWidth:"0.64",children:e.jsx("path",{d:"M7.536 8.657l2.828-2.83c.39-.39 1.024-.39 1.414 0 .39.392.39 1.025 0 1.416l-3.535 3.535c-.196.195-.452.293-.707.293-.256 0-.512-.097-.708-.292l-2.12-2.12c-.39-.392-.39-1.025 0-1.415s1.023-.39 1.413 0zM8 16c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm0-2c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6z"})});default:return null}},m=()=>{switch(i){case"processing":return"Your payment is being processed. Please wait...";case"failed":return"Failed to capture payment...";case"completed":return"Course purchased successfully";default:return""}};return e.jsx("div",{className:"payment-success-container",style:{position:"fixed",background:"rgba(0, 0, 0, 0.6)",display:"flex",justifyContent:"center",width:"100%",height:"100%",alignItems:"center"},children:e.jsxs("div",{style:{background:"white",padding:"20px",borderRadius:"10px",maxWidth:"500px",width:"80%",position:"relative",height:"max-content",animation:"fadeIn 0.3s ease"},className:"d-flex flex-column flex-nowrap justify-content-between align-items-center",children:[e.jsx("div",{children:u()}),e.jsx("p",{className:"text-center",children:m()}),e.jsx(f,{to:`/courses/details/${s}`,relative:"path",className:"my-3 mx-auto px-3 py-2 rounded-3 text-light btn btn-warning",children:"Back To Homepage"})]})})},k=p.memo(w);export{k as default};
