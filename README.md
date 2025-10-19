

### **HealthSecure: Blockchain-Powered Medical Records Management**

HealthSecure is a decentralized application (dApp) that leverages the BlockDAG blockchain to create a secure, private, and user-centric system for managing and sharing medical records. By integrating smart contracts, decentralized storage, and client-side encryption, it ensures patients have ultimate control over their sensitive health data.

---

### **🚀 Key Features**

*   **Patient-Centric Control:** Users own and manage their medical records, granting and revoking access as needed.
*   **Military-Grade Security:** All records are encrypted with AES-256 on the client-side before being stored, ensuring data remains private and secure.
*   **Tamper-Proof Audit Trail:** The BlockDAG blockchain immutably records all transactions, consents, and access grants, providing a verifiable history.
*   **Decentralized Storage:** Encrypted files are stored on IPFS via Pinata, eliminating single points of failure and enhancing data resilience.
*   **Secure Data Sharing:** Patients can securely grant time-limited access to healthcare providers directly, without intermediaries.
*   **AI-Powered Insights:** (Mock Implementation) Uploaded records are analyzed to provide predictive health insights, showcasing the potential for advanced analytics on secure data.
*   **Intuitive User Interface:** A modern, responsive UI built with React and Tailwind CSS ensures a smooth and accessible user experience.

---

### **🛠️ Tech Stack**

| Component | Technology |
| :--- | :--- |
| **Blockchain** | BlockDAG (Ethereum-compatible) |
| **Smart Contracts** | Solidity |
| **Frontend** | React (Next.js), Tailwind CSS, Framer Motion |
| **Web3 Integration** | Ethers.js |
| **Storage** | IPFS (Pinned via Pinata) |
| **Encryption** | AES-256-CBC (Key derived via PBKDF2) |

---

### **🔗 Smart Contract Addresses**

*   **HealthConsent:** `0x3fcb10a808Cb6F90DD7027Ac765Eeb75Bd5f6157`
    *   Manages user consent for using the platform.
*   **MedicalRecords:** `0x01A8f810F50a0aE8Eb5ad9928506e77bbC93B7A4`
    *   Stores encrypted file references (IPFS CIDs) and key material.
*   **MedicalRecordAccess:** `0xC379206a95B6bb841ac97F4ff15927218465694C`
    *   Manages access control lists for sharing records with other addresses.

---

### **📋 Prerequisites**

Before you begin, ensure you have the following installed and set up:

1.  **Node.js** (v16 or higher)
2.  **MetaMask** (or another Ethereum-compatible wallet)
3.  An **Ethereum-compatible network** configured in your wallet (e.g., a BlockDAG testnet/mainnet)
4.  A **Pinata account** for IPFS storage and API keys.

---

### **⚡ Quick Start Guide**

Follow these steps to get a local development environment running:

1.  **Clone the Repository**
    ```bash
    git clone <repository-url>
    cd healthsecure
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env.local` file in the root directory and add your Pinata credentials:
    ```
    NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key_here
    NEXT_PUBLIC_PINATA_API_SECRET=your_pinata_api_secret_here
    ```

4.  **Start the Development Server**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

---

### **👨‍💻 How to Use HealthSecure**

#### **1. Connect Your Wallet**
*   On the application's homepage, click "Connect Wallet" to authenticate using MetaMask.

#### **2. Sign Consent Agreement**
*   Navigate to your dashboard and digitally sign the consent agreement via the `HealthConsent` smart contract to proceed.

#### **3. Upload a Medical Record**
*   Go to the **Upload** page.
*   Drag and drop or select a medical file (PDF/TXT, max 20MB).
*   The file is automatically encrypted, uploaded to IPFS, and its reference is recorded on the blockchain.
*   View the mock AI analysis results for the uploaded record.

#### **4. Share a Record Securely**
*   On the **Transfer** page, select a record you have uploaded.
*   Enter the recipient's wallet address and set an optional expiration period (in days).
*   Grant access, which will be recorded via the `MedicalRecordAccess` contract.

#### **5. View a Record**
*   Authorized users can click the **"View"** button on any accessible record.
*   The app fetches the necessary key material from the blockchain, reconstructs the encryption key, and decrypts the file, opening it in a new tab.

---

### **🔒 Technical Deep Dive**

*   **Encryption Workflow:** A unique AES-256 key is deterministically derived from the user's wallet signature using PBKDF2. This key is used to encrypt the file locally before it ever leaves the browser.
*   **Key Management:** Critical key material is stored on the blockchain via the `MedicalRecords` contract, allowing for secure key reconstruction by authorized users without relying on vulnerable local storage.
*   **Access Control:** The `MedicalRecordAccess` smart contract acts as a permissions ledger, explicitly defining who can access which records and for how long.

---

### **⚠️ Known Limitations & Future Roadmap**

**Current Limitations:**
*   File size is capped at 20MB due to Pinata's free tier limits.
*   Requires a stable connection to both the BlockDAG network and IPFS.
*   The AI analysis component is a mock demonstration.

**Planned Enhancements:**
*   Support for additional file formats (e.g., DICOM for medical images).
*   Integration of real, privacy-preserving AI models for disease prediction.
*   A user interface for easily revoking granted access.
*   Exploration of multi-factor authentication for enhanced wallet security.

---

### **🤝 Contributing**

We welcome contributions! Please follow these steps:

1.  Fork the Project.
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the Branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

### **📄 License**

This project is distributed under the **MIT License**. See the `LICENSE` file for more details.# HealthSecure
