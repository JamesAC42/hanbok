const { getDb } = require('../../database');

// List of admin emails with access to user management
const ADMIN_EMAILS = ['jamescrovo450@gmail.com'];

const updateUser = async (req, res) => {
    try {
        const db = getDb();
        const adminUserId = req.session.user?.userId;
        if(!adminUserId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized access'
            });
        }
        
        // Verify the user is an admin
        const adminUser = await db.collection('users').findOne({ userId: adminUserId });
        if (!adminUser || !ADMIN_EMAILS.includes(adminUser.email.toLowerCase())) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized access'
            });
        }
        
        const { userId } = req.params;
        const updateData = req.body;
        
        // Validate userId
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid user ID'
            });
        }
        
        // Define allowed fields to update
        const allowedFields = [
            'tier',
            'maxSavedSentences',
            'maxSavedWords',
            'remainingImageExtracts',
            'remainingSentenceAnalyses',
            'verified',
            'hasUsedFreeTrial',
            'remainingAudioGenerations'
        ];
        
        // Build update object with only allowed fields
        const updateObject = {};
        for (const field of allowedFields) {
            if (updateData.hasOwnProperty(field)) {
                // Type conversion and validation
                if (field === 'tier' || field === 'maxSavedSentences' || field === 'maxSavedWords' ||
                    field === 'remainingImageExtracts' || field === 'remainingSentenceAnalyses' ||
                    field === 'remainingAudioGenerations') {
                    const value = parseInt(updateData[field]);
                    if (!isNaN(value)) {
                        updateObject[field] = value;
                    }
                } else if (field === 'verified' || field === 'hasUsedFreeTrial') {
                    updateObject[field] = Boolean(updateData[field]);
                }
            }
        }
        
        if (Object.keys(updateObject).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid fields to update'
            });
        }
        
        // Additional validation
        if (updateObject.tier !== undefined && ![0, 1, 2].includes(updateObject.tier)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid tier value. Must be 0 (free), 1 (basic), or 2 (plus)'
            });
        }
        
        // Update the user
        const result = await db.collection('users').updateOne(
            { userId: parseInt(userId) },
            { $set: updateObject }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        // Get the updated user (excluding sensitive data)
        const updatedUser = await db.collection('users').findOne(
            { userId: parseInt(userId) },
            { projection: { password: 0 } }
        );
        
        res.json({
            success: true,
            message: 'User updated successfully',
            user: updatedUser
        });
        
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user'
        });
    }
};

module.exports = { updateUser }; 