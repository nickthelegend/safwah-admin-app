# 🏛️ Safwah FTA Admin Portal Frontend

This React + Vite application serves as the administrative interface for the UAE Federal Tax Authority (FTA). It provides operational control over the Safwah protocol.

## 🌟 Features

* **Admin Access Control**: Requires connecting the administrative SUI address to unlock system features.
* **Verifier Management**: Issue and revoke `VerifierCap` objects to customs gate officers to grant/block audit capacities.
* **Merchant Licensing Control**: Approve or suspend merchant registrations in the global system registry to prevent VAT fraud.
* **Fee Collection Treasury**: Monitor collected transaction fees (5% protocol share) and withdraw accumulated funds to the FTA admin wallet.
* **Global Protocol Stats**: Monitor total claims, settled amounts, and USDC values currently locked in the escrow contract.

## ⚙️ Configuration (`.env`)

Configure the following variables in a `.env` file:
```env
VITE_SUI_PACKAGE_ID=0x96604c290f1467bf041b080bf945518d56f597cb6a07d0d698466c44ed0eabfb
VITE_SAFWAH_ESCROW_ID=0x36da6295fa6bf907034fa65a84f5f921aa46997b7c492d3c7b2dc0c184115990
VITE_SAFWAH_ADMIN_ID=0xa35448ad356aa9c43d5de33aa3dfabbea81ae89961b62345f1f601e8a88f1b4f
VITE_MERCHANT_REGISTRY_ID=0x28659ebac204de2bdb7b76ae5336b12db82771edca09b60707d7422dea3cb4d1
VITE_SAFWAH_TREASURY_ID=0xe987212d1738565bf15fb0174320fe2b923b5c052d17bf908d88cb9afe9c8036
VITE_MERCHANT_ADMIN_CAP_ID=0xb5d9fdcdcee992476541e33cc74c113c30c130f714536e86e7d52f04c18d1b87
```

## 🚀 Execution & Testing

### Install dependencies:
```bash
npm install
```

### Run in development mode:
```bash
npm run dev
```

### Run tests:
```bash
npm run test
```
