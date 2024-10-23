import{f as v,r as n,H as l,R as w,j as e,I as N,b as k,L as c,M as C,J as R,e as T,_ as a,K as P,P as S}from"./index-C4rIzEKt.js";import{T as I}from"./Timer-CbK6WQSK.js";function z(){const m=v(),[t,g]=n.useState({email:"",password:"",code:""}),[r,d]=n.useState("idle"),[u,p]=n.useState(!1),[h,x]=n.useState(l);w.useEffect(()=>{(async()=>{let s=await T(l);x(s)})()},[]);function o(i){const{name:s,value:j}=i.target;g(y=>({...y,[s]:j}))}async function b(){if(!t.email)return a.error("Please enter the email address field.");d("submitting");const i=a.loading("Sending OTP..."),s=await P({email:t.email});d("idle"),a.remove(i),s.status==="success"&&s.message?(a.success(s.message),p(!0)):a.error(s.message)}async function f(){if(!t.email)return a.error("Please enter the email address field.");if(!t.password)return a.error("Please enter the password field.");if(!t.code)return a.error("Please enter the sent OTP Code.");const i=a.loading("Restoring..."),s=await S(t.code,{email:t.email,password:t.password});s.status==="success"&&s.message?(a.remove(i),a.success(s.message),setTimeout(()=>{m("/login")},3e3)):(a.remove(i),a.error(s.message))}return e.jsxs("div",{style:{width:"100%",height:"100%"},className:"bg-lightGray py-5 px-5",children:[e.jsx(N,{position:"top-center",reverseOrder:!1}),e.jsx("section",{className:"sign-in",children:e.jsx("div",{className:"container shadow login",children:e.jsxs("div",{className:"signin-content",children:[e.jsxs("div",{className:"signin-image",children:[e.jsx("figure",{className:"d-none d-md-block d-lg-block d-xl-block d-xxl-block",children:e.jsx(k.LazyLoadImage,{src:l,placeholderSrc:async()=>await h,effect:"blur"})}),e.jsx(c,{to:"/signup",className:"signup-image-link",children:"Create an account"})]}),e.jsxs("div",{className:"signin-form",children:[e.jsx("h2",{className:"form-title fw-bold display-5 mb-5",children:"Restore Your Account"}),e.jsxs("div",{className:"register-form",id:"login-form",children:[e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"email",children:e.jsx("i",{style:{marginTop:"12px",marginRight:"20px"},className:"zmdi zmdi-account material-icons-name login-label"})}),e.jsx("input",{type:"email",name:"email",id:"email",className:"px-4",value:t.email,onChange:o,placeholder:"Your email"})]}),e.jsxs("div",{className:"form-group form-button row g-3",children:[e.jsx(C,{courseId:"hgvjknb",title:"Restore Account",buttonText:"Restore",bStyles:"rounded-3 text-light btn btn-primary px-3 py-2",footer:e.jsx("button",{onClick:f,disabled:r==="submitting",type:"button",className:`btn ${r==="idle"?"btn-primary":r==="submitting"?"btn-secondary":"btn-danger"}`,children:"Restore"}),children:e.jsxs(E,{children:[e.jsx("p",{children:"Establish account access by configuring the necessary details."}),e.jsx("label",{htmlFor:"static-email",children:"Email address"}),e.jsx("input",{type:"text",id:"static-email",value:t.email,disabled:!0}),e.jsx("label",{htmlFor:"verification-code",children:"Click the button Get Code"}),e.jsx("span",{className:"text-danger fw-medium",children:u&&e.jsx(I,{})}),e.jsxs("div",{className:"get-code",children:[e.jsx("input",{type:"text",id:"verification-code",maxLength:7,name:"code",value:t.code,onChange:o,placeholder:"enter OTP Code"}),e.jsx("button",{disabled:r==="submitting",onClick:b,children:"Get Code"})]}),e.jsx("p",{children:"Check your email and get the verification code"}),e.jsx("label",{htmlFor:"new-password",children:"Password"}),e.jsx("input",{type:"password",name:"password",id:"new-password",value:t.password,onChange:o})]})}),e.jsx(c,{to:"/forgotpassword",className:"signup-image-link",children:"forgot password"})]})]})]})]})})})]})}const E=R.div`
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
`;export{z as default};
