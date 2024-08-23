exports.secureHelmet={   
    contentSecurityPolicy:{
        directives: {
            defaultSrc: ["'self'","https://res.cloudinary.com"],
            imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
            scriptSrc: ["'self'"],
            mediaSrc: ["'self'", "https://res.cloudinary.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
          }
    },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'no-referrer' },
    hsts: process.env.NODE_ENV === "production" ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    } : undefined,
    noSniff: true,
    dnsPrefetchControl: { allow: false },
    ieNoOpen: true,
    frameguard: { action: 'deny' },
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    hidePoweredBy: true
}