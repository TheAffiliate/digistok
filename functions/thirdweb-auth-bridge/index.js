/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const { Client, Users, Databases, Query } = require('node-appwrite');

module.exports = async ({ req, res, log, error }) => {
  const { walletAddress } = JSON.parse(req.body);

  if (!walletAddress) {
    return res.json({ success: false, error: 'Wallet address is required' }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const users = new Users(client);
  const databases = new Databases(client);

  try {
    // 1. Check if user exists in your Appwrite database
    const userList = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID, 
      'users',
      [Query.equal('wallet_address', walletAddress)]
    );

    let appwriteUserId;

    if (userList.total > 0) {
      // User exists, get their Appwrite ID
      appwriteUserId = userList.documents[0].user_id;
    } else {
      // 2. Create a new Appwrite user for this wallet
      const newUser = await users.create(
        'unique()',
        `${walletAddress}@wallet.digistok.com`, // Temporary email for Appwrite Auth
        undefined,
        walletAddress
      );
      appwriteUserId = newUser.$id;

      // 3. Create the user profile in your 'users' table
      await databases.createDocument(
        process.env.APPWRITE_DATABASE_ID,
        'users',
        'unique()',
        {
          user_id: appwriteUserId,
          wallet_address: walletAddress,
          full_name: `User ${walletAddress.slice(0, 6)}`,
          fica_status: 'pending',
        }
      );
    }

    // 4. Generate a short-lived custom token for this user
    const token = await users.createToken(appwriteUserId);

    // 5. Return the token secret to the client
    return res.json({ 
      success: true, 
      userId: appwriteUserId, 
      secret: token.secret 
    });

  } catch (err) {
    error('Error creating session token: ' + err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};