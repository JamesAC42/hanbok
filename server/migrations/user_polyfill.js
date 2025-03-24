const polyfillData = async (user, db) => {
    // Ensure all required fields are present
    if (user.email === undefined || user.userId === undefined || user.name === undefined || 
        user.googleId === undefined || user.tier === undefined) {
        console.error("Missing required fields for user:", user.userId);
        // Cannot update user with missing critical fields
        return user;
    }

    // Helper function to safely update a field
    const safeUpdate = async (field, defaultValue) => {
        if (user[field] === undefined) {
            try {
                await db.collection('users').updateOne(
                    { userId: user.userId },
                    { $set: { [field]: defaultValue } }
                );
                user[field] = defaultValue;
                console.log(`Updated user ${user.userId} with default ${field}:`, defaultValue);
            } catch (err) {
                console.error(`Failed to update ${field} for user ${user.userId}:`, err);
                // Still set the value in memory so the login can complete
                user[field] = defaultValue;
            }
        }
    };

    // Update all fields, each in its own try-catch to continue even if one fails
    await Promise.all([
        safeUpdate('remainingAudioGenerations', 10),
        safeUpdate('maxSavedSentences', 30),
        safeUpdate('maxSavedWords', 60),
        safeUpdate('remainingImageExtracts', 20),
        safeUpdate('remainingSentenceAnalyses', 0),
        safeUpdate('feedbackAudioCreditRedeemed', false)
    ]);

    // Ensure dateCreated is a Date object
    if (user.dateCreated === undefined) {
        try {
            const now = new Date();
            await db.collection('users').updateOne(
                { userId: user.userId },
                { $set: { dateCreated: now } }
            );
            user.dateCreated = now;
        } catch (err) {
            console.error(`Failed to update dateCreated for user ${user.userId}:`, err);
            user.dateCreated = new Date(); // Fallback to ensure the user object has the field
        }
    } else if (!(user.dateCreated instanceof Date) && typeof user.dateCreated === 'string') {
        try {
            const dateObj = new Date(user.dateCreated);
            await db.collection('users').updateOne(
                { userId: user.userId },
                { $set: { dateCreated: dateObj } }
            );
            user.dateCreated = dateObj;
        } catch (err) {
            console.error(`Failed to convert dateCreated to Date for user ${user.userId}:`, err);
            // Try to parse it locally even if DB update fails
            try {
                user.dateCreated = new Date(user.dateCreated);
            } catch {
                user.dateCreated = new Date(); // Last resort
            }
        }
    }

    return user;
}

module.exports = polyfillData;