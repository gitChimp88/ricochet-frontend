import Web3 from 'web3';
// @ts-ignore
import { aggregate } from '@makerdao/multicall';

export const makeBatchRequest = async (calls: any[], web3: Web3) => {
	debugger;
	const config = { web3, multicallAddress: process.env.REACT_APP_MULTICALL_CONTRACT_ADDRESS };

	// TODO: Sometimes this throws error - Error in loadData:  Error: insufficient data for uint256 type (arg="", coderType="uint256", value="0x", version=4.0.49)
	// When it throws an error it restarts loadData again
	const response = await aggregate(calls, config);
	return response?.results?.transformed || [];
};
