import { useState } from "react";
import "./App.css";
import abi from "./contracts/donation.json";
import { ethers } from "ethers";

const donationAddress = "0x3986FD026EBF1d20ED8B69A07c5AAAaac16B9Ef8";

const App = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(null);
  const [donationValue, setDonationValue] = useState("0.00001");
  const [donationResult, setDonationResult] = useState(null);
  const [totaDonations, setTotaDonations] = useState(false);

  const Wallet = () => {
    const onClick = async () => {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setCurrentAccount(accounts[0]);
        setIsLoading(false);
      } catch (err) {
        console.log(err);
      }
    };

    return window.ethereum ? (
      <button onClick={onClick} className="cta-button connect-wallet-button">
        Connect Wallet
      </button>
    ) : (
      <a href="https://metamask.io">
        <button className="cta-button connect-wallet-button">
          Install Metamask
        </button>
      </a>
    );
  };

  const Donation = () => {
    const onDonateClick = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(donationAddress, abi, provider);
      const contractSigner = contract.connect(signer);
      const nonce = await provider.getTransactionCount(currentAccount);
      const gasPrice = await provider.getGasPrice();
      const donationAmount = ethers.utils.parseEther(donationValue);
      const overrides = {
        gasPrice: 2 * gasPrice,
        gasLimit: 10 * 21000,
        value: donationAmount,
        nonce: nonce,
      };

      setIsLoading(true);

      try {
        const transaction = await contractSigner.donate(overrides);

        contract.on("DonationTransferred", async (from, amount, tx) => {
          const balance = ethers.utils.formatEther(
            await provider.getBalance(from)
          );
          const totaDonations = ethers.utils.formatEther(
            await contract.getTotalDonations()
          );

          setCurrentBalance(balance);
          setTotaDonations(totaDonations);
          setDonationResult(transaction);
          setIsLoading(false);
        });
      } catch (err) {
        setIsLoading(false);
        console.log(err);
      }
    };

    const result = () => {
      return (
        <div className="card">
          <div className="result">
            <h4>
              <b>Thank you for your donation!</b>
            </h4>
            <p>Sender Address: ${currentAccount}</p>
            <p>Amount: ${donationValue} ETH</p>
            <p>Balance: ${currentBalance} ETH</p>
            <p>Total Donations: ${totaDonations} ETH</p>

            <button
              onClick={() => setDonationResult(null)}
              className="cta-button donation-button"
            >
              Donate Again
            </button>
          </div>
        </div>
      );
    };

    const donationInput = () => {
      return (
        <div>
          <input
            className="donation-input"
            type="number"
            value={donationValue}
            step=".00001"
            min=".00001"
            onChange={(ev) => setDonationValue(ev.target.value)}
          />
          <button
            onClick={onDonateClick}
            className="cta-button donation-button"
          >
            Donate
          </button>
        </div>
      );
    };

    return donationResult ? result() : donationInput();
  };

  const Loader = () => {
    return <div className="app-loader"></div>;
  };

  const Main = () => (currentAccount ? Donation() : Wallet());

  return (
    <div className="main-app">
      <h1>Espresso Code Challenge</h1>
      {isLoading ? Loader() : Main()}
    </div>
  );
}

export default App;
