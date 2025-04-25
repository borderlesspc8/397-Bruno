echo "\n==== listTransactions ===="
curl -v -b "next-auth.session-token=797ae2c6f3a968f2a326e3cf9816db2aea11f3a062aafcb701e7d904b4306e82" "http://localhost:3001/api/transactions/search"

echo "\n==== listWallets ===="
curl -v -b "next-auth.session-token=797ae2c6f3a968f2a326e3cf9816db2aea11f3a062aafcb701e7d904b4306e82" "http://localhost:3001/api/wallets"

echo "\n==== getUserProfile ===="
curl -v -b "next-auth.session-token=797ae2c6f3a968f2a326e3cf9816db2aea11f3a062aafcb701e7d904b4306e82" "http://localhost:3001/api/user/profile"