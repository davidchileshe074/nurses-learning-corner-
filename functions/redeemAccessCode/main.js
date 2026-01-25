const { Client, Databases, Query, ID } = require('node-appwrite');

module.exports = async ({ req, res, log, error }) => {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(req.headers['x-appwrite-key'] || process.env.APPWRITE_FUNCTION_API_KEY);

    const databases = new Databases(client);

    // 1. Parse Data
    let body;
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (e) {
        return res.json({ success: false, message: 'Invalid JSON payload' }, 400);
    }

    const { code, userId } = body;
    const databaseId = 'nmlc';

    if (!code || !userId) {
        return res.json({ success: false, message: 'Missing code or userId' }, 400);
    }

    try {
        // 2. Find the Access Code
        const codes = await databases.listDocuments(databaseId, 'accessCodes', [
            Query.equal('code', code),
            Query.equal('isUsed', false)
        ]);

        if (codes.total === 0) {
            return res.json({ success: false, message: 'Invalid or already used code.' });
        }

        const accessCodeDoc = codes.documents[0];
        const days = accessCodeDoc.durationDays;

        // 3. Check for existing subscription
        const subs = await databases.listDocuments(databaseId, 'subscriptions', [
            Query.equal('userId', userId)
        ]);

        let endDate = new Date();
        if (subs.total > 0) {
            const currentSub = subs.documents[0];
            const currentEnd = new Date(currentSub.endDate);
            endDate = currentEnd > new Date() ? currentEnd : new Date();
            endDate.setDate(endDate.getDate() + days);

            await databases.updateDocument(databaseId, 'subscriptions', currentSub.$id, {
                endDate: endDate.toISOString(),
                status: 'ACTIVE'
            });
        } else {
            endDate.setDate(endDate.getDate() + days);
            await databases.createDocument(databaseId, 'subscriptions', ID.unique(), {
                userId,
                startDate: new Date().toISOString(),
                endDate: endDate.toISOString(),
                status: 'ACTIVE'
            });
        }

        // 4. Mark code as used
        await databases.updateDocument(databaseId, 'accessCodes', accessCodeDoc.$id, {
            isUsed: true,
            usedByUserId: userId,
            usedAt: new Date().toISOString()
        });

        return res.json({ success: true, durationDays: days });

    } catch (err) {
        return res.json({ success: false, message: err.message }, 500);
    }
};
