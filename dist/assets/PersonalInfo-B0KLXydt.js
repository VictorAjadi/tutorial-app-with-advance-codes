import{f as v,r as u,g as y,j as e,M as C,J as N,v as P,m as S,_ as t,$ as T,a0 as F,a1 as $}from"./index-C4rIzEKt.js";import{T as k}from"./Timer-CbK6WQSK.js";const D="_container_124og_13",E="_content_124og_25",O="_tabs_124og_31",A="_tab_124og_31",G="_active_124og_49",I="_beta_124og_91",M="_btn_124og_109",n={container:D,content:E,tabs:O,tab:A,active:G,"form-group":"_form-group_124og_57",beta:I,btn:M,"btn-secondary":"_btn-secondary_124og_127"};function J(){const b=v(),[m,i]=u.useState("idle"),[x,h]=u.useState(!1),[d,g]=u.useState({password:null,confirm_password:null}),l=y().admin,[a,w]=u.useState({email:l.email||"",mobile_number:l.mobile_number||"",name:l.name||"",password:"",current_password:"",confirm_password:"",code:""});function o(r){const{name:s,value:p}=r.target;[s]=="password"?g(c=>({...c,password:P(p)})):[s]=="confirm_password"&&g(c=>({...c,confirm_password:S(a.password,p)})),w(c=>({...c,[s]:p}))}async function f(){i("submitting");const r=t.loading("Sending OTP..."),s=await T();i("idle"),t.remove(r),s.status==="success"&&s.message?(t.success(s.message),h(!0)):t.error(s.message)}async function _(){i("submitting");const r=t.loading("Saving..."),s=await F({email:a.email,name:a.name,mobile_number:a.mobile_number});i("idle"),t.remove(r),s.status==="success"&&s.message?t.success(s.message):t.error(s.message)}async function j(){i("submitting");const r=t.loading("Updating..."),s=await $(a.code,{password:a.password,current_password:a.current_password,confirm_password:a.confirm_password});i("idle"),t.remove(r),s.status==="success"&&s.message?(t.success(s.message),setTimeout(()=>{b("/admin/login")},3e3)):t.error(s.message)}return e.jsxs("div",{className:n.content+" px-3",children:[e.jsxs("div",{className:n.tabs,children:[e.jsx("div",{className:`${n.tab} ${n.active}`,children:"Personal Information"}),"        "]}),e.jsxs("div",{className:n.container,children:[e.jsx("h2",{children:"Personal Information"}),e.jsxs("div",{className:n["form-group"],children:[e.jsx("label",{htmlFor:"name",children:"Username"}),e.jsx("input",{name:"name",type:"text",id:"name",value:a.name,onChange:o})]}),e.jsxs("div",{className:n["form-group"],children:[e.jsx("label",{htmlFor:"mobile-number",children:"Mobile Number"}),e.jsx("input",{name:"mobile_number",type:"text",id:"mobile-number",value:a.mobile_number,onChange:o})]}),e.jsxs("div",{className:n["form-group"],children:[e.jsx("label",{htmlFor:"email",children:"Email"}),e.jsx("input",{type:"email",name:"email",id:"email",value:a.email,onChange:o})]}),e.jsx("h2",{children:"General Preferences"}),e.jsxs("div",{className:n["form-group"],children:[e.jsx("label",{htmlFor:"language",children:"Language"}),e.jsx("select",{id:"language",children:e.jsx("option",{children:"English"})}),e.jsx("small",{children:"Supported only for the Digital Asset Management product."})]}),e.jsx(C,{courseId:l._id,title:"Set Password",buttonText:"Set Password",bStyles:`${n.btn} ${n["btn-secondary"]} py-2`,footer:e.jsx("button",{onClick:j,disabled:m==="submitting",type:"button",className:`btn ${m==="idle"?"btn-primary":m==="submitting"?"btn-secondary":"btn-danger"}`,children:"Process"}),children:e.jsxs(U,{children:[e.jsx("p",{children:"Establish account access by configuring the necessary details."}),e.jsx("label",{htmlFor:"static-email",children:"Email address"}),e.jsx("input",{type:"text",id:"static-email",value:l.email,disabled:!0}),e.jsx("label",{htmlFor:"verification-code",children:"Click the button Get Code"}),e.jsx("span",{className:"text-danger fw-medium",children:x&&e.jsx(k,{})}),e.jsxs("div",{className:"get-code",children:[e.jsx("input",{type:"text",id:"verification-code",maxLength:7,name:"code",value:a.code,onChange:o,placeholder:"enter OTP Code"}),e.jsx("button",{disabled:m==="submitting",onClick:f,children:"Get Code"})]}),e.jsx("p",{children:"Check your email and get the verification code"}),e.jsx("label",{htmlFor:"current-password",children:"Current Password"}),e.jsx("input",{type:"password",name:"current_password",id:"current-password",value:a.current_password,onChange:o}),e.jsx("label",{htmlFor:"new-password",children:"New Password"}),e.jsx("input",{type:"password",name:"password",id:"new-password",value:a.password,onChange:o}),d.password&&e.jsx("p",{className:`${d.password.status==="error"?"text-danger":"text-success"} fw-bold`,children:d.password.message}),e.jsx("label",{htmlFor:"confirm-password",children:"Confirm New Password"}),e.jsx("input",{type:"password",name:"confirm_password",id:"confirm-password",value:a.confirm_password,onChange:o}),d.confirm_password&&e.jsx("p",{className:`${d.confirm_password.status==="error"?"text-danger":"text-success"} fw-bold`,children:d.confirm_password.message})]})}),e.jsx("button",{className:`${n.btn} mx-3`,onClick:_,children:"Save Changes"})]})]})}const U=N.div`
    font-size: 14px;
    color: #333;
    max-height: 600px;
    overflow-y: scroll;
    label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
    }

    input[type='text'],
    input[type='password'] {
        width: calc(100% - 20px);
        padding: 10px;
        margin-bottom: 20px;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
    }

    input[type='text']:disabled {
        background-color: #f0f0f0;
    }

    .get-code {
        display: flex;
        align-items: center;

        input {
            flex: 1;
        }

        button {
            padding: 10px 20px;
            margin-left: 10px;
            border: none;
            background-color: #e0e0e0;
            border-radius: 4px;
            cursor: pointer;
        }
    }
`;export{J as default};
