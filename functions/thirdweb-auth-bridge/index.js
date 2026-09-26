const { Client, Users, Databases, Query } = require('node-appwrite');

module.exports = async ({ req, res, log, error }) => {
  log('🚀 Function started. Body type: ' + typeof req.body);

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const walletAddress = body.walletAddress;

    log('🚀 Wallet address received: ' + walletAddress);

    if (!walletAddress) {
      return res.json({ success: false, error: 'Wallet address is required' }, 400);
    }

    // Hardcoded values — no more undefined env vars!
    const client = new Client()
      .setEndpoint('https://fra.cloud.appwrite.io/v1')
      .setProject('6a958751003ddf56c626')
      .setKey(process.env.APPWRITE_API_KEY);

    const users = new Users(client);
    const databases = new Databases(client);

    log('🚀 Checking for existing user...');

    const userList = await databases.listDocuments(
      '6a95dc45001293a69918', // Hardcoded DB ID
      'users',
      [Query.equal('wallet_address', walletAddress)]
    );

    let appwriteUserId;

    if (userList.total > 0) {
      appwriteUserId = userList.documents[0].user_id;
      log('🚀 Existing user found: ' + appwriteUserId);
    } else {
      log('🚀 Creating new user...');
      const newUser = await users.create(
        'unique()',
        `${walletAddress}@wallet.digistok.com`,
        undefined,
        walletAddress
      );
      appwriteUserId = newUser.$id;

      await databases.createDocument(
        '6a95dc45001293a69918',
        'users',
        'unique()',
        {
          user_id: appwriteUserId,
          wallet_address: walletAddress,
          full_name: `User ${walletAddress.slice(0, 6)}`,
          fica_status: 'pending',
        }
      );
      log('🚀 New user created: ' + appwriteUserId);
    }

    const token = await users.createToken(appwriteUserId);
    log('🚀 Token generated successfully');

    return res.json({
      success: true,
      userId: appwriteUserId,
      secret: token.secret
    });

  } catch (err) {
    error('💥 Function crashed: ' + (err.message || JSON.stringify(err)));
    return res.json({ success: false, error: err.message || 'Unknown error' }, 500);
  }
};