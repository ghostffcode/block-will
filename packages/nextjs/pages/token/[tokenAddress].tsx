import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { useScaffoldContractRead } from "../../hooks/scaffold-eth/useScaffoldContractRead";
import { useScaffoldContractWrite } from "../../hooks/scaffold-eth/useScaffoldContractWrite";
import { addYears, formatDistanceToNow } from "date-fns";
import { ethers } from "ethers";
import { NextPage } from "next";
import { DayPicker } from "react-day-picker";
import { useAccount, useToken } from "wagmi";
import { MetaHeader } from "~~/components/MetaHeader";
import { AddressInput, InputBase } from "~~/components/scaffold-eth";

// const dateToNumber = (date: Date) => Math.trunc(date.valueOf() / 1000);

const TokenPage: NextPage = () => {
  const router = useRouter();
  const { tokenAddress } = router.query;
  const { address } = useAccount();
  const [beneficiary, setBeneficiary] = useState<string>("");
  const [percentage, setPercentage] = useState<number>(0);
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<Date>();
  const { data: tokenInfo } = useToken({
    address: tokenAddress as string,
  });

  const { writeAsync: willToken } = useScaffoldContractWrite({
    contractName: "TokenWill",
    functionName: "willToken",
    args: [beneficiary, tokenAddress as string, ethers.BigNumber.from(percentage || "0")],
  });

  const { writeAsync: registerProof } = useScaffoldContractWrite({
    contractName: "TokenWill",
    functionName: "registerProof",
    args: [ethers.BigNumber.from(((selectedDay || 0)?.valueOf() / 1000).toString())],
  });

  const { data: deadline } = useScaffoldContractRead({
    contractName: "TokenWill",
    functionName: "deadline",
    args: [address as string],
  });

  const { data: totalAllocation } = useScaffoldContractRead({
    contractName: "TokenWill",
    functionName: "getTotalAllocation",
    args: [address as string, tokenAddress as string],
  });

  const renderDeadline = useCallback(() => {
    const allocationTill = deadline?.toNumber() || 0;
    const now = Math.trunc(new Date().valueOf() / 1000);

    if (allocationTill === 0) {
      return (
        <span>
          You have not set an allocation deadline yet, which means they are available to your beneficiaries immediately.
        </span>
      );
    } else if (now > allocationTill) {
      return <span>Your allocation deadline has expired and your tokens are now available to all beneficiaries</span>;
    } else {
      return (
        <span>
          Your tokens will be open to your beneficiaries{" "}
          {formatDistanceToNow(allocationTill * 1000, { addSuffix: true })}
        </span>
      );
    }
  }, [deadline]);

  return (
    <>
      <MetaHeader />
      <section className="max-w-lg mx-auto mt-36 my-20 space-y-12">
        <div className="flex items-center flex-col flex-grow">
          <h1 className="text-center">
            <span className="block text-4xl font-bold">
              Allocate {tokenInfo?.name} ({tokenInfo?.symbol})
            </span>
          </h1>
          <div className="flex flex-1 flex-col justify-center w-full mt-2 space-y-2">
            <div className="text-center">{renderDeadline()}</div>
            <button className="btn btn-primary" onClick={() => setShowPicker(!showPicker)}>
              Change unlock date
            </button>

            {showPicker && (
              <div className="mt-4 flex flex-1 flex-col items-center justify-center">
                <DayPicker
                  mode="single"
                  captionLayout="dropdown-buttons"
                  selected={selectedDay}
                  onSelect={setSelectedDay}
                  fromDate={new Date()}
                  toDate={addYears(new Date(), 20)}
                  classNames={{
                    day_selected: "bg-blue-600 text-primary-foreground",
                  }}
                />
                <button className="btn btn-primary" onClick={registerProof}>
                  Set date
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center w-full mx-auto space-y-2">
          <div className="text-center">
            Total % of {tokenInfo?.symbol} allocation shared: {totalAllocation?.toString() || 0} / 100
          </div>
          <progress
            className="progress progress-warning w-full"
            value={totalAllocation?.toString() || 0}
            max="100"
          ></progress>
        </div>

        <div className="flex flex-1 flex-col w-full mt-8 mx-auto space-y-3">
          <AddressInput placeholder="Beneficiary Address" value={beneficiary} onChange={setBeneficiary} />
          <InputBase
            type="number"
            placeholder="Allocation percentage"
            value={percentage}
            onChange={setPercentage}
            suffix={
              <div className="flex flex-nowrap mt-1 px-2">
                <span className="whitespace-nowrap">% of your {tokenInfo?.symbol} balance</span>
              </div>
            }
          />
          <div className="w-full text-center">
            <button className="btn btn-primary" disabled={percentage === 0} onClick={willToken}>
              Allocate {percentage} {tokenInfo?.symbol}
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default TokenPage;
