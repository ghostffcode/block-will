import { useState } from "react";
import { useRouter } from "next/router";
import { ethers } from "ethers";
import type { NextPage } from "next";
// import Link from "next/link";
// import { BugAntIcon, MagnifyingGlassIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { MetaHeader } from "~~/components/MetaHeader";
import { AddressInput } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const router = useRouter();
  const [tokenAddress, setTokenAddress] = useState<string>("");

  return (
    <>
      <MetaHeader />
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">Token Will Implementation</span>
          </h1>
          <p className="text-center text-lg">
            Get started by editing{" "}
            <code className="italic bg-base-300 text-base font-bold">packages/nextjs/pages/index.tsx</code>
          </p>
        </div>

        <div className="flex flex-1 flex-col w-full max-w-lg mt-8">
          <AddressInput placeholder="Token Address" value={tokenAddress} onChange={setTokenAddress} />

          <button
            onClick={() => router.push(`/token/${tokenAddress}`)}
            disabled={!ethers.utils.isAddress(tokenAddress)}
            className="btn btn-primary mt-4"
          >
            Start Allocation
          </button>
        </div>
      </div>
    </>
  );
};

export default Home;
