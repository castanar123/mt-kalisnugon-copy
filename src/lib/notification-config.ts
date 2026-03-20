export const EMAIL_CONFIG = {
    SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_nwhz8gy",
    PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "KX8y6feyx4ifea6_I",
    TEMPLATES: {
        OTP: import.meta.env.VITE_EMAILJS_OTP_TEMPLATE || "template_dcs8uaj",
        RESERVATION: import.meta.env.VITE_EMAILJS_RESERVATION_TEMPLATE || "template_quhvfai",
    }
};

export const SMS_CONFIG = {
    API_KEY: import.meta.env.VITE_SMS_API_KEY || "sk-2b10ytoffbszfcclqjtavfvngexycg2x",
    BASE_URL: "/api/v1/send/sms"
};
