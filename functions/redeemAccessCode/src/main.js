const { Client, Databases, Query, ID } = require('node-appwrite');

module.exports = async ({ req, res, log, error }) => {
    const client = new Client();
    const databases = new Databases(client);

    const endpoint = process.env.APPWRITE_FUNCTION_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
    const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID || '691d352300367a9ca3ac';
    const apiKey = process.env.APPWRITE_API_KEY;

    if (!apiKey) {
        return res.json({ success: false, message: 'Missing APPWRITE_API_KEY' }, 500);
    }

    client
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);

    let data;
    try {
        data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (e) {
        data = req.body;
    }

    const { code, userId } = data || {};
    const databaseId = 'nmlc';

    if (!code || !userId) {
        return res.json({ success: false, message: 'Missing code or userId' }, 400);
    }

    try {
        // 1. Find Code
        log(`Searching for code: ${code}`);
        const codes = await databases.listDocuments(databaseId, 'accessCodes', [
            Query.equal('code', String(code)),
            Query.equal('isUsed', false),
            Query.limit(1)
        ]);

        if (codes.total === 0) {
            return res.json({ success: false, message: 'Code invalid or already used' });
        }

        const accessCodeDoc = codes.documents[0];
        const days = parseInt(accessCodeDoc.durationDays, 10) || 30;

        // 2. Find/Update Subscription
        log(`Checking subscription for user: ${userId}`);
        const subs = await databases.listDocuments(databaseId, 'subscriptions', [
            Query.equal('userId', String(userId)),
            Query.limit(1)
        ]);

        let endDate = new Date();
        const commonData = {
            subscriptionId: 'PREMIUM_ACCESS',
            subscriptionName: 'Premium Nurse Learning Corner',
            status: 'ACTIVE',
            autoRenew: false,
        };

        if (subs.total > 0) {
            log('Updating existing subscription');
            const currentSub = subs.documents[0];
            const currentEnd = new Date(currentSub.endDate);
            endDate = currentEnd > new Date() ? currentEnd : new Date();
            endDate.setDate(endDate.getDate() + days);

            await databases.updateDocument(databaseId, 'subscriptions', currentSub.$id, {
                ...commonData,
                endDate: endDate.toISOString(),
            });
        } else {
            log('Creating new subscription');
            endDate.setDate(endDate.getDate() + days);
            await databases.createDocument(databaseId, 'subscriptions', ID.unique(), {
                ...commonData,
                userId: String(userId),
                startDate: new Date().toISOString(),
                endDate: endDate.toISOString(),
            });
        }

        // 3. Burn Code
        log('Marking code as used');
        await databases.updateDocument(databaseId, 'accessCodes', accessCodeDoc.$id, {
            isUsed: true,
            usedByUserId: String(userId),
            usedAt: new Date().toISOString()
        });

        return res.json({ success: true, durationDays: days });
    } catch (err) {
        error('Appwrite Error: ' + err.message);
        return res.json({ success: false, message: err.message }, 500);
    }
};
