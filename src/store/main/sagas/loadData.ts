import { call, put, select } from 'redux-saga/effects';
import { Unwrap } from 'types/unwrap';
import { getAddress } from 'utils/getAddress';
import { mainGetData, mainSetState } from '../actionCreators';
import {
	checkIfApproveDai,
	checkIfApproveMatic,
	checkIfApproveUsdc,
	checkIfApproveWbtc,
	checkIfApproveWeth,
} from './checkIfApprove';
import { getBalances } from './getBalances';
// import { sweepQueryFlow } from './sweepQueryFlow';
import { selectMain } from '../selectors';
import { getCoingeckoPrices } from '../../../utils/getCoingeckoPrices';
import { getChainlinkPrices } from '../../../utils/priceFeeds/getPriceFeed';

export function* loadData() {
	try {
		console.log('loadData');
		yield put(mainSetState({ isLoading: true, isReadOnly: false }));
		const main: ReturnType<typeof selectMain> = yield select(selectMain);
		console.log('main: ', main);
		const { web3 } = main;
		const address: Unwrap<typeof getAddress> = yield call(getAddress, web3);
		console.log('address: ', address);
		yield put(mainSetState({ address }));
		const coingeckoPrices: Unwrap<typeof getCoingeckoPrices> = yield call(getCoingeckoPrices);

		const chainlinkPrices: Unwrap<typeof getChainlinkPrices> = yield call(getChainlinkPrices);

		console.log('chainlinkPrices: ', chainlinkPrices);
		console.log('coingeckoPrices: ', coingeckoPrices);
		yield call(getBalances, address);

		yield call(checkIfApproveUsdc);
		yield call(checkIfApproveDai);
		yield call(checkIfApproveWeth);
		yield call(checkIfApproveWbtc);
		yield call(checkIfApproveMatic);
		debugger;
		// yield call(sweepQueryFlow);

		yield put(
			mainSetState({
				address,
				coingeckoPrices,
				chainlinkPrices,
				isLoading: false,
			}),
		);
	} catch (e) {
		console.log('Error in loadData: ', e);
		yield put(mainGetData());
	}
}
