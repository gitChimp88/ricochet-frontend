import { ethers, BigNumber } from 'ethers';
// import { getRpcProvider } from "../../../helpers/getChainDetails";
import { priceFeedAddresses } from './priceFeedAddresses';
import {
	DAIxAddress,
	MATICxAddress,
	USDCxAddress,
	WBTCxAddress,
	WETHxAddress,
	// StIbAlluoETHAddress,
	// StIbAlluoUSDAddress,
	// StIbAlluoBTCAddress,
	// RICAddress,
} from '../../constants/polygon_config';
import { chainSettings } from 'constants/chainSettings';

const aggregatorV3InterfaceABI = [
	{
		inputs: [],
		name: 'decimals',
		outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [],
		name: 'description',
		outputs: [{ internalType: 'string', name: '', type: 'string' }],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [{ internalType: 'uint80', name: '_roundId', type: 'uint80' }],
		name: 'getRoundData',
		outputs: [
			{ internalType: 'uint80', name: 'roundId', type: 'uint80' },
			{ internalType: 'int256', name: 'answer', type: 'int256' },
			{ internalType: 'uint256', name: 'startedAt', type: 'uint256' },
			{ internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
			{ internalType: 'uint80', name: 'answeredInRound', type: 'uint80' },
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [],
		name: 'latestRoundData',
		outputs: [
			{ internalType: 'uint80', name: 'roundId', type: 'uint80' },
			{ internalType: 'int256', name: 'answer', type: 'int256' },
			{ internalType: 'uint256', name: 'startedAt', type: 'uint256' },
			{ internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
			{ internalType: 'uint80', name: 'answeredInRound', type: 'uint80' },
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [],
		name: 'version',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function',
	},
];

const priceFeedIds = new Map<string, string>([
	[DAIxAddress, priceFeedAddresses.dai],
	[USDCxAddress, priceFeedAddresses.usdc],
	[WETHxAddress, priceFeedAddresses.eth],
	[WBTCxAddress, priceFeedAddresses.wbtc],
	[MATICxAddress, priceFeedAddresses.matic],
	// [RICAddress, 'richochet'], We should get this from coingecko
]);

export const getPriceFeed = async (address: string): Promise<number | undefined> => {
	// chain details would need to be passed in
	const provider = new ethers.providers.JsonRpcProvider(chainSettings.rpcUrls);

	// Map symbol of token and chainId to priceFeed contract address
	const addr: string | undefined = priceFeedIds.get(address);

	if (!addr) {
		// There is no chainlink price feed use a different api (coingecko)
		return undefined;
	}

	const priceFeed = new ethers.Contract(addr, aggregatorV3InterfaceABI, provider);

	let price: any;
	try {
		price = await priceFeed.latestRoundData();
	} catch (e) {
		console.log(`Error fetching price feed from contract ${addr} with eror ${e}`);
		// Error handling here
	}

	const hexString = price.answer._hex;
	const bigNumberFromHexString = BigNumber.from(hexString);
	const fixedPrice = ethers.utils.formatUnits(bigNumberFromHexString, 8);
	console.log(`fixed price from chainlink for ${address} - `, fixedPrice);
	return Number(fixedPrice);
};

export const getChainlinkPrices = async (): Promise<{ [key: string]: number | undefined }> => {
	const tokenAddresses = [...priceFeedIds.keys()];
	const chainlinkPrices: { [key: string]: number | undefined } = {};

	for (let i = 0; i < tokenAddresses.length; i++) {
		const tokenAddress = tokenAddresses[i];
		const chainlinkPrice = await getPriceFeed(tokenAddress);
		chainlinkPrices[tokenAddress] = chainlinkPrice;
	}

	return chainlinkPrices;
};
