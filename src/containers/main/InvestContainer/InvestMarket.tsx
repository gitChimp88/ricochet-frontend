import { ChangeEvent, FC, useCallback, useEffect, useState } from 'react';
import { FontIcon, FontIconName } from 'components/common/FontIcon';
import history from 'utils/history';
import { TextInput } from 'components/common/TextInput';
import { PanelChange } from 'components/layout/PanelChange';
import { ExchangeKeys } from 'utils/getExchangeAddress';
import styles from './styles.module.scss';
import { flowConfig, FlowEnum, InvestmentFlow, RoutesToFlowTypes } from 'constants/flowConfig';
import { useShallowSelector } from 'hooks/useShallowSelector';
import { selectMain, selectUserStreams } from 'store/main/selectors';
import { useRouteMatch } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addReward, updateHistory } from 'store/main/actionCreators';

type InvestMarketProps = {
	handleStart: any;
	handleStop: any;
};

export const InvestMarket: FC<InvestMarketProps> = ({ handleStart, handleStop }) => {
	const state = useShallowSelector(selectMain);
	const userStreams = useShallowSelector(selectUserStreams);
	const { balances, isLoading, coingeckoPrices, chainlinkPrices } = state;
	const [filteredList, setFilteredList] = useState(flowConfig);
	const [aggregatedRewards, setAggregatedRewards] = useState<number[]>([]);
	const { aggregatedRICRewards } = useShallowSelector(selectMain);
	const [search, setSearch] = useState('');
	const match = useRouteMatch();
	const dispatch = useDispatch();
	const flowType = RoutesToFlowTypes[match.path];
	const { linkHistory } = useShallowSelector(selectMain);

	useEffect(() => {
		if (flowType) {
			let sortedList = flowConfig.filter((each) => each.type === flowType);
			sortedList = sortedList.sort((a, b) => {
				const totalVolumeA = parseFloat(getFlowUSDValue(a));
				const totalVolumeB = parseFloat(getFlowUSDValue(b));
				return totalVolumeB - totalVolumeA;
			});
			setFilteredList(sortedList);
		} else {
			const sortedUserStreams = userStreams.sort((a, b) => {
				const flowA = parseFloat(state[a.flowKey]?.placeholder || '0');
				const flowB = parseFloat(state[b.flowKey]?.placeholder || '0');
				return flowB - flowA;
			});
			setFilteredList(sortedUserStreams);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [flowType, userStreams]);

	const handleSearch = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			const { value } = e.target;
			setSearch(value);
			const filtered = flowConfig.filter(
				(el) =>
					el.coinA.toUpperCase().includes(value.toUpperCase()) ||
					el.coinB.toUpperCase().includes(value.toUpperCase()),
			);
			setFilteredList(filtered);
		},
		[setFilteredList],
	);

	function sumStrings(a: number, b: string): number {
		return a + parseFloat(b);
	}
	function endDate(bal: number, outgoing: number): string {
		const outgoingPerMs = outgoing / (30 * 24 * 60 * 60 * 1000);
		const endDateTimestamp = Date.now() + bal / outgoingPerMs;
		const endDateStr = new Date(endDateTimestamp).toLocaleDateString();
		return `${endDateStr}`;
	}

	function retrieveEndDate(flowKey: FlowEnum, currentState: any, currentBalances: any) {
		const flow = flowConfig.find((flow_) => flow_.flowKey === flowKey);
		const sameCoinAFlows = flowConfig.filter((flow_) => flow_.coinA === flow?.coinA);
		const outgoing = sameCoinAFlows.map((flow_) => currentState[flow_.flowKey]?.placeholder || '0');
		const outgoingSum = outgoing.reduce(sumStrings, 0);
		const bal = parseFloat((currentBalances && currentBalances[flow?.tokenA || '']) || '0');
		return endDate(bal, outgoingSum);
	}
	function computeStreamEnds(currentState: any, currentBalances: any) {
		const streamEnds: { [id: string]: string } = {};
		Object.values(FlowEnum).forEach((flowEnum: FlowEnum) => {
			streamEnds[flowEnum] = retrieveEndDate(flowEnum, currentState, currentBalances);
		});
		return streamEnds;
	}

	const streamEnds = computeStreamEnds(state, balances);

	useEffect(() => {
		let aggregated = 0;
		aggregatedRewards.forEach((reward) => {
			aggregated = aggregated + reward;
		});
		dispatch(updateHistory(history.location.hash));
		if (aggregatedRICRewards && linkHistory.length <= 2) {
			dispatch(addReward(`${aggregated}`));
			return;
		} else {
			console.log('skipped func');
			return;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [aggregatedRewards]);

	const handleSetAggregatedRewards = (reward_amount: number) => {
		setAggregatedRewards((aggregatedRewards) => [...aggregatedRewards, reward_amount]);
	};

	function getFlowUSDValue(flow: InvestmentFlow, toFixed: number = 0) {
		return (
			coingeckoPrices ? parseFloat(state[flow.flowKey]?.flowsOwned as string) * coingeckoPrices[flow.tokenA] : 0
		).toFixed(toFixed);
	}

	function filterBuy() {
		const filteredData = flowConfig.filter(
			(item) => item.coinA === 'USDC' || item.coinA === 'DAI' || item.coinA === 'IbAlluoUSD',
		);

		setFilteredList(filteredData);
	}

	function filterSell() {
		const filteredData = flowConfig.filter(
			(item) =>
				item.coinA === 'MATIC' || item.coinA === 'ETH' || item.coinA === 'WBTC' || item.coinA === 'IbAlluoBTC',
		);

		setFilteredList(filteredData);
	}

	function filterYield() {
		const filteredData = flowConfig.filter(
			(item) => item.coinA === 'IbAlluoUSD' || item.coinA === 'IbAlluoETH' || item.coinA === 'IbAlluoBTC',
		);

		setFilteredList(filteredData);
	}

	console.log('main state - ', state);
	console.log('coingeckoPrices - ', coingeckoPrices);
	console.log('chainlinkPrices - ', chainlinkPrices);
	return (
		<>
			<div className={styles.input_wrap}>
				<div className={styles.filterButtonGroup}>
					<button className={styles.filterBuyButton} onClick={() => filterBuy()}>
						Buy
					</button>
					<button className={styles.filterSellButton} onClick={() => filterSell()}>
						Sell
					</button>
					<button className={styles.filterYieldButton} onClick={() => filterYield()}>
						Yield
					</button>
				</div>
				<TextInput
					value={search}
					placeholder={'Search by Name'}
					onChange={handleSearch}
					className={styles.input}
					containerClassName={styles.container_input}
					left={<FontIcon name={FontIconName.Search} className={styles.search} size={16} />}
				/>
			</div>

			<div className={styles.headers}>
				<div className={styles.market}>{'Stream Market'}</div>
				<div className={styles.stream}>{'Your Stream'}</div>
				<div className={styles.balances}>{'Your Balances'}</div>
				<div className={styles.streaming}>{'Total Value Streaming'}</div>
				<div className={styles.ends}>{''}</div>
			</div>
			<div className={styles.content}>
				{filteredList &&
					filteredList.map((element, idx) => (
						<div className={styles.panel} key={`${element.coinA}-${element.coinB}-${element.flowKey}`}>
							<PanelChange
								placeholder={'Input Rate'}
								onClickStart={handleStart(element)}
								onClickStop={handleStop(element)}
								coinA={element.coinA}
								coingeckoPrice={coingeckoPrices ? coingeckoPrices[element.tokenA] : 0}
								chainlinkPrice={chainlinkPrices ? chainlinkPrices[element.tokenA] : 0}
								coinB={element.coinB}
								tokenA={element.tokenA}
								tokenB={element.tokenB}
								balanceA={balances && balances[element.tokenA]}
								balanceB={balances && balances[element.tokenB]}
								totalFlow={state[element.flowKey]?.flowsOwned}
								totalFlows={state[element.flowKey]?.totalFlows}
								streamEnd={streamEnds[element.flowKey]}
								subsidyRate={
									new Date().toLocaleDateString().split('/').reverse().join('') >=
									(state[element.flowKey]?.subsidyRate.endDate.split('/').reverse().join('') || '0')
										? undefined
										: state[element.flowKey]?.subsidyRate
								}
								personalFlow={state[element.flowKey]?.placeholder}
								mainLoading={isLoading}
								flowType={element.type}
								isReadOnly={state.isReadOnly}
								contractAddress={element.superToken}
								exchangeKey={element.flowKey.replace('FlowQuery', '') as ExchangeKeys}
								indexVal={idx}
								streamedSoFar={state[element.flowKey]?.streamedSoFar}
								receivedSoFar={state[element.flowKey]?.receivedSoFar}
								aggregateRewards={handleSetAggregatedRewards}
							/>
						</div>
					))}
			</div>

			{filteredList.length === 0 && (
				<div className={styles.empty_state}>
					<FontIcon name={FontIconName.Search} size={30} />
					<span className={styles.empty_state_text}>
						<div>{'No results found'}</div>
					</span>
				</div>
			)}
		</>
	);
};
