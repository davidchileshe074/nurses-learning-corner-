import { functions } from './appwriteClient';

export const sendWhatsappOtp = async (whatsappNumber: string, userId: string) => {
    try {
        const result = await functions.createExecution(
            'sendWhatsappOtp', // Replace with your function ID
            JSON.stringify({ whatsappNumber, userId })
        );
        return JSON.parse(result.responseBody);
    } catch (error: any) {
        console.error('Send OTP Error:', error);
        throw new Error(error.message);
    }
};

export const verifyWhatsappOtp = async (userId: string, code: string) => {
    try {
        const result = await functions.createExecution(
            'verifyWhatsappOtp', // Replace with your function ID
            JSON.stringify({ userId, code })
        );
        return JSON.parse(result.responseBody);
    } catch (error: any) {
        console.error('Verify OTP Error:', error);
        throw new Error(error.message);
    }
};
