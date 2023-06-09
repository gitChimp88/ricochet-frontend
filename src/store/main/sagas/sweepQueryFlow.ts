import { all, call, put, select } from 'redux-saga/effects';
// import { RICAddress } from 'constants/polygon_config';
import { Unwrap } from 'types/unwrap';
import { getAddress } from 'utils/getAddress';
import { queryFlows, queryStreams, queryReceived } from 'api';
import { getFlow } from 'api/ethereum';

import { getReceviedFlows } from 'utils/getReceviedFlows';
import { getOwnedFlows } from 'utils/getOwnedFlows';
import { Flow } from 'types/flow';

import { flowConfig, FlowEnum } from 'constants/flowConfig';
// import { erc20ABI } from 'constants/ABIs/ERC20';
// import { getContract } from 'utils/getContract';

import calculateStreamedSoFar from 'pages/InvestPage/utils/calculateStreamedSoFar';
import { mainSetState, sweepQuery } from '../actionCreators';
import { selectMain } from '../selectors';

const exchangeContractsAddresses = flowConfig.map((f) => f.superToken);

export function* sweepQueryFlow(): any {
	try {
		yield put(mainSetState({ flowStateLoading: true }));
		const main: ReturnType<typeof selectMain> = yield select(selectMain);
		const { web3 } = main;
		const address: Unwrap<typeof getAddress> = yield call(getAddress, web3);
		const results: any[] = yield all(exchangeContractsAddresses.map((addr) => call(queryFlows, addr)));

		const streamedSoFarMap: Record<string, number> = {};
		const receivedSoFarMap: Record<string, number> = {};

		if (address) {
			const [streamed, received] = yield all([call(queryStreams, address), call(queryReceived, address)]);
			(streamed?.data?.data?.streams || []).forEach((stream: any) => {
				const streamedSoFar = streamedSoFarMap[`${stream.token.id}-${stream.receiver.id}`] || 0;
				Object.assign(streamedSoFarMap, {
					[`${stream.token.id}-${stream.receiver.id}`]:
						Number(streamedSoFar) +
						Number(
							calculateStreamedSoFar(
								stream.streamedUntilUpdatedAt,
								stream.updatedAtTimestamp,
								stream.currentFlowRate,
							),
						),
				});
			});

			(received?.data?.data?.streams || []).forEach((stream: any) => {
				const receivedSoFar = receivedSoFarMap[`${stream.token.id}-${stream.sender.id}`] || 0;
				Object.assign(receivedSoFarMap, {
					[`${stream.token.id}-${stream.sender.id}`]:
						Number(receivedSoFar) +
						Number(
							calculateStreamedSoFar(
								stream.streamedUntilUpdatedAt,
								stream.updatedAtTimestamp,
								stream.currentFlowRate,
							),
						),
				});
			});
		}

		const flows: { [key: string]: { flowsOwned: Flow[]; flowsReceived: Flow[] } } = {};
		exchangeContractsAddresses.forEach((el, i) => {
			if (results[i].data.data.account != null) {
				flows[el] = results[i].data.data.account;
			} else {
				flows[el] = { flowsOwned: [], flowsReceived: [] };
			}
		});

		// const getTheFlow = async (web3: any, tokenAxAddress: any, exchangeAddress: any) => {
		// 	const personalFlow = await getFlow(web3, tokenAxAddress, exchangeAddress);
		// 	return personalFlow;
		// };

		const buildFlowQuery = async (flowKey: string) => {
			const flowConfigObject = flowConfig.find((o) => o.flowKey === flowKey);
			const exchangeAddress = flowConfigObject?.superToken || '';
			const tokenAxAddress = flowConfigObject?.tokenA || '';
			const tokenAtokenBFlows = flows[exchangeAddress];
			const tokenAtokenBFlowsReceived = getReceviedFlows(
				tokenAtokenBFlows.flowsReceived,
				tokenAxAddress,
				address,
			);

			let streamedSoFar;
			let receivedSoFar;

			if (Object.keys(streamedSoFarMap).length) {
				streamedSoFar = streamedSoFarMap[`${tokenAxAddress.toLowerCase()}-${exchangeAddress.toLowerCase()}`];
			}

			if (Object.keys(receivedSoFarMap).length) {
				receivedSoFar = receivedSoFarMap[`${tokenAxAddress.toLowerCase()}-${exchangeAddress.toLowerCase()}`];
			}
			debugger;
			// use getFlow function from ethereum.ts to get this information
			// const tokenAtokenBPlaceholder = ((tokenAtokenBFlowsReceived / 10 ** 18) * (30 * 24 * 60 * 60)).toFixed(6);
			// replace placeholder here with getFlows and await the result
			// const personalFlow = getTheFlow(web3, tokenAxAddress, exchangeAddress);
			const personalFlow = await getFlow(web3, tokenAxAddress, exchangeAddress);
			console.log('personal flow returning a value for token - ', personalFlow);

			// const personalFlow = yield call(getFlow, web3, tokenAxAddress, exchangeAddress);
			const flowsOwned = getOwnedFlows(tokenAtokenBFlows.flowsReceived, tokenAxAddress);
			const subsidyRate = { perso: 0, total: 0, endDate: 'unknown' };

			return {
				flowKey,
				flowsReceived: tokenAtokenBFlowsReceived,
				flowsOwned,
				totalFlows: tokenAtokenBFlows.flowsReceived.length,
				placeholder: personalFlow,
				streamedSoFar,
				receivedSoFar,
				subsidyRate, // await getSubsidyRate(FlowEnum.daiMkrFlowQuery,
			};
		};

		// const usdcRicFlowQuery = buildFlowQuery(FlowEnum.usdcRicFlowQuery);
		const usdcRicFlowQuery = yield call(buildFlowQuery, FlowEnum.usdcRicFlowQuery);

		const twoWayusdcWethFlowQuery = yield call(buildFlowQuery, FlowEnum.twoWayusdcWethFlowQuery);
		const twoWayusdcWbtcFlowQuery = yield call(buildFlowQuery, FlowEnum.twoWayusdcWbtcFlowQuery);
		const twoWaywethUsdcFlowQuery = yield call(buildFlowQuery, FlowEnum.twoWaywethUsdcFlowQuery);
		const twoWaywbtcUsdcFlowQuery = yield call(buildFlowQuery, FlowEnum.twoWaywbtcUsdcFlowQuery);
		const twoWayUsdcRicFlowQuery = yield call(buildFlowQuery, FlowEnum.twoWayUsdcRicFlowQuery);
		const twoWayRicUsdcFlowQuery = yield call(buildFlowQuery, FlowEnum.twoWayRicUsdcFlowQuery);
		debugger;
		const twoWayMaticUsdcFlowQuery = yield call(buildFlowQuery, FlowEnum.twoWayMaticUsdcFlowQuery);
		const twoWayUsdcMaticFlowQuery = yield call(buildFlowQuery, FlowEnum.twoWayUsdcMaticFlowQuery);
		const usdcDaiFlowQuery = yield call(buildFlowQuery, FlowEnum.usdcDaiFlowQuery);
		const daiUsdcFlowQuery = yield call(buildFlowQuery, FlowEnum.daiUsdcFlowQuery);

		yield put(
			mainSetState({
				usdcRicFlowQuery,
				// ricRexShirtFlowQuery,
				// ricRexHatFlowQuery,
				twoWayusdcWethFlowQuery,
				twoWayusdcWbtcFlowQuery,
				twoWaywethUsdcFlowQuery,
				twoWaywbtcUsdcFlowQuery,
				twoWayUsdcRicFlowQuery,
				twoWayRicUsdcFlowQuery,
				twoWayMaticUsdcFlowQuery,
				twoWayUsdcMaticFlowQuery,
				usdcDaiFlowQuery,
				daiUsdcFlowQuery,
				// flow should have it's own seperate loader
				flowStateLoading: false,
			}),
		);
	} catch (e) {
		console.log('Error in sweepQueryFlow: ', e);
		yield put(sweepQuery());
	}
}
