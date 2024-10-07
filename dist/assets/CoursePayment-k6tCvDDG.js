import{g as k,r as g,j as t,b as C,p as j,e as S}from"./index-u5watr16.js";function $(){var h;const n=k().payments,[p,x]=g.useState(""),[b,D]=g.useState({completed:!0,pending:!1,failed:!1,refunded:!1}),[w,y]=g.useState({completed:[],pending:[],failed:[],refunded:[]});g.useEffect(()=>{const a=new Date;switch(p){case"1 day":const d=new Date;d.setMonth(a.getDate()-1),y(s=>{var l,i,o,c;return{completed:(l=n.course)!=null&&l.completed?n.course.completed.filter(e=>new Date(e.paymentDate)>=d&&new Date(e.paymentDate)<=a):s.completed,pending:(i=n.course)!=null&&i.pending?n.course.pending.filter(e=>new Date(e.paymentDate)>=d&&new Date(e.paymentDate)<=a):s.pending,failed:(o=n.course)!=null&&o.failed?n.course.failed.filter(e=>new Date(e.paymentDate)>=d&&new Date(e.paymentDate)<=a):s.failed,refunded:(c=n.course)!=null&&c.refunded?n.course.refunded.filter(e=>new Date(e.paymentDate)>=d&&new Date(e.paymentDate)<=a):s.refunded}});break;case"7 days":const r=new Date;r.setDate(a.getDate()-7),y(s=>{var l,i,o,c;return{completed:(l=n.course)!=null&&l.completed?n.course.completed.filter(e=>new Date(e.paymentDate)>=r&&new Date(e.paymentDate)<=a):s.completed,pending:(i=n.course)!=null&&i.pending?n.course.pending.filter(e=>new Date(e.paymentDate)>=r&&new Date(e.paymentDate)<=a):s.pending,failed:(o=n.course)!=null&&o.failed?n.course.failed.filter(e=>new Date(e.paymentDate)>=r&&new Date(e.paymentDate)<=a):s.failed,refunded:(c=n.course)!=null&&c.refunded?n.course.refunded.filter(e=>new Date(e.paymentDate)>=r&&new Date(e.paymentDate)<=a):s.refunded}});break;case"30 days":const u=new Date;u.setDate(a.getDate()-30),y(s=>{var l,i,o,c;return{completed:(l=n.course)!=null&&l.completed?n.course.completed.filter(e=>new Date(e.paymentDate)>=u&&new Date(e.paymentDate)<=a):s.completed,pending:(i=n.course)!=null&&i.pending?n.course.pending.filter(e=>new Date(e.paymentDate)>=u&&new Date(e.paymentDate)<=a):s.pending,failed:(o=n.course)!=null&&o.failed?n.course.failed.filter(e=>new Date(e.paymentDate)>=u&&new Date(e.paymentDate)<=a):s.failed,refunded:(c=n.course)!=null&&c.refunded?n.course.refunded.filter(e=>new Date(e.paymentDate)>=u&&new Date(e.paymentDate)<=a):s.refunded}});break;case"3 months":const m=new Date;m.setMonth(a.getMonth()-3),y(s=>{var l,i,o,c;return{completed:(l=n.course)!=null&&l.completed?n.course.completed.filter(e=>new Date(e.paymentDate)>=m&&new Date(e.paymentDate)<=a):s.completed,pending:(i=n.course)!=null&&i.pending?n.course.pending.filter(e=>new Date(e.paymentDate)>=m&&new Date(e.paymentDate)<=a):s.pending,failed:(o=n.course)!=null&&o.failed?n.course.failed.filter(e=>new Date(e.paymentDate)>=m&&new Date(e.paymentDate)<=a):s.failed,refunded:(c=n.course)!=null&&c.refunded?n.course.refunded.filter(e=>new Date(e.paymentDate)>=m&&new Date(e.paymentDate)<=a):s.refunded}});break;case"12 months":const f=new Date;f.setFullYear(a.getFullYear()-1),y(s=>{var l,i,o,c;return{completed:(l=n.course)!=null&&l.completed?n.course.completed.filter(e=>new Date(e.paymentDate)>=f&&new Date(e.paymentDate)<=a):s.completed,pending:(i=n.course)!=null&&i.pending?n.course.pending.filter(e=>new Date(e.paymentDate)>=f&&new Date(e.paymentDate)<=a):s.pending,failed:(o=n.course)!=null&&o.failed?n.course.failed.filter(e=>new Date(e.paymentDate)>=f&&new Date(e.paymentDate)<=a):s.failed,refunded:(c=n.course)!=null&&c.refunded?n.course.refunded.filter(e=>new Date(e.paymentDate)>=f&&new Date(e.paymentDate)<=a):s.refunded}});break;default:y(s=>{var l,i,o,c;return{completed:(l=n.course)!=null&&l.completed?n.course.completed:s.completed,pending:(i=n.course)!=null&&i.pending?n.course.pending:s.pending,failed:(o=n.course)!=null&&o.failed?n.course.failed:s.failed,refunded:(c=n.course)!=null&&c.refunded?n.course.refunded:s.refunded}});break}},[p,n.course]);function N(a){const{id:d}=a.currentTarget;d==="completed"?D(r=>({...r,completed:!r.completed})):d==="pending"?D(r=>({...r,pending:!r.pending})):d==="failed"?D(r=>({...r,failed:!r.failed})):d==="refunded"&&D(r=>({...r,refunded:!r.refunded}))}return t.jsxs("div",{className:"bg-lightGray rounded-3 shadow p-3",children:[t.jsxs("div",{className:"row gap-5 justify-content-between align-items-start",children:[t.jsxs("ul",{className:"col",children:[t.jsx("li",{children:t.jsx("h3",{className:"text-medium text-dark text-nowrap",children:"Course Payment Transactions"})}),t.jsx("li",{children:t.jsx("p",{className:"text-nowrap text-dark",children:"This page shows all payment made to all courses"})})]}),t.jsxs("div",{className:"col rounded-pill d-inline-flex flex-nowrap gap-4 bg-white p-0",children:[t.jsx("button",{type:"button",onClick:()=>x(""),className:`${p===""?"btn btn-primary text-light":"btn btn-transparent text-dark"} py-2 px-3 rounded-pill text-nowrap`,children:"All"}),t.jsx("button",{type:"button",onClick:()=>x("1 day"),className:`${p==="1 day"?"btn btn-primary text-light":"btn btn-transparent text-dark"} py-2 px-3 rounded-pill text-nowrap`,children:"→ a day ago"}),t.jsx("button",{type:"button",onClick:()=>x("7 days"),className:`${p==="7 days"?"btn btn-primary text-light":"btn btn-transparent text-dark"} py-2 px-3 rounded-pill text-nowrap`,children:"→ 7 days"}),t.jsx("button",{type:"button",onClick:()=>x("30 days"),className:`${p==="30 days"?"btn btn-primary text-light":"btn btn-transparent text-dark"} py-2 px-3 rounded-pill text-nowrap`,children:"→ 30 days"}),t.jsx("button",{type:"button",onClick:()=>x("3 months"),className:`${p==="3 months"?"btn btn-primary text-light":"btn btn-transparent text-dark"} py-2 px-3 rounded-pill text-nowrap`,children:"→ 3 months"}),t.jsx("button",{type:"button",onClick:()=>x("12 months"),className:`${p==="12 months"?"btn btn-primary text-light":"btn btn-transparent text-dark"} py-2 px-3 rounded-pill text-nowrap`,children:"→ 12 months"})]})]}),((h=n.course)==null?void 0:h.completed.length)>0&&w&&t.jsx(t.Fragment,{children:["completed","pending","failed","refunded"].map(a=>t.jsx(t.Fragment,{children:w[a].length>0?t.jsxs("div",{className:"rounded-3 shadow card bg-white text-dark w-100 m-4",children:[t.jsx("hr",{className:"border-3 border-secondary"}),t.jsxs("div",{className:"d-flex flex-row justify-content-between align-items-start gap-5 p-3",children:[t.jsxs("h5",{className:"fw-bold text-capitalize",children:[a," Transaction"]}),t.jsx("button",{onClick:N,id:`${a}`,className:"btn bg-transparent border-0",children:t.jsxs("svg",{fill:"#000000",width:"30px",className:`toggle-btn ${!b[a]&&"active"}`,height:"32px",viewBox:"0 0 24 24",xmlns:"http://www.w3.org/2000/svg",children:[t.jsx("g",{id:"SVGRepo_bgCarrier",strokeWidth:"0"}),t.jsx("g",{id:"SVGRepo_tracerCarrier",strokeLinecap:"round",strokeLinejoin:"round"}),t.jsx("g",{id:"SVGRepo_iconCarrier",children:t.jsx("path",{d:"M5 21h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2zm7-14 5 5h-4v5h-2v-5H7l5-5z"})})]})})]}),b[a]&&t.jsx(t.Fragment,{children:w[a].map((d,r)=>{var u,m,f;return t.jsxs("div",{children:[t.jsx("hr",{className:"border-2 border-secondary"}),t.jsxs("div",{className:"transaction d-flex gap-3 justify-content-between align-items-start px-3",children:[t.jsxs("div",{className:"d-flex gap-3 align-items-start",children:[t.jsx(C.LazyLoadImage,{src:d.studentId.profile_image||j,height:"50px",width:"50px",className:"rounded-circle border-secondary border border-4",placeholderSrc:async()=>await S(d.studentId.profile_image||j),effect:"blur"}),t.jsxs("ul",{children:[t.jsxs("li",{className:"fs-6 text-nowrap",children:[t.jsx("span",{className:"fw-bold text-dark",children:"Paid By"})," : ",t.jsx("cite",{children:((u=d.studentId)==null?void 0:u.name)||""})," ",t.jsx("span",{className:"fw-bold fs-4",children:"  →  "})," ",t.jsxs("span",{children:[" ",t.jsx("cite",{children:((m=d.courseId.instructor)==null?void 0:m.name)||""})]})]}),t.jsxs("li",{className:"fs-6 text-nowrap",children:[t.jsx("span",{className:"fw-bold text-dark",children:"Course"})," : ",t.jsx("cite",{children:(f=d.courseId)==null?void 0:f.title})]}),t.jsxs("li",{className:"fs-6 text-nowrap",children:[t.jsx("span",{className:"fw-bold text-dark",children:"Transaction ID"})," : ",t.jsx("cite",{children:d.transactionId||""})]})]})]}),t.jsxs("div",{className:"date",children:[new Date(d.paymentDate).toDateString(),t.jsx("br",{}),new Date(d.paymentDate).toLocaleTimeString("en-US")]}),t.jsxs("div",{className:"amount fw-bold text-primary",children:["+",d.amount,d.currency]}),t.jsx("div",{className:`${d.status==="completed"?"text-success":d.status==="pending"?"text-warning":d.status==="failed"?"text-danger":"text-primary"} fw-bold`,children:d.status})]})]},r)})})]}):t.jsx(t.Fragment,{})}))})]})}export{$ as default};