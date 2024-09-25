import React, { useEffect, useState } from "react";
import { useReadContract } from "wagmi";

interface TokenBoundDetailsProps {
  address: string;
}

const TBADetails: React.FC<TokenBoundDetailsProps> = ({ address }) => {
  const [details, setDetails] = useState<any>(null);

  const { data, isError, isLoading } = useReadContract({
    address: address as `0x${string}`,
    abi: [
      /* Your TBA contract ABI */
    ],
    functionName: "getDetails",
  });

  useEffect(() => {
    if (data) {
      setDetails(data);
    }
  }, [data]);

  if (isLoading) return <div>Loading TBA details...</div>;
  if (isError) return <div>Error loading TBA details</div>;

  return (
    <div className="space-y-2">
      <h4 className="text-lg font-semibold">Token Bound Account Details</h4>
      <p>Address: {address}</p>
      {details && (
        <>
          <p>Owner: {details.owner}</p>
          <p>Balance: {details.balance}</p>
          {/* Add more details as needed */}
        </>
      )}
    </div>
  );
};

export default TBADetails;
