import React, { useEffect } from 'react';
import { MainRouter } from 'containers/MainRouter';
import { useDispatch } from 'react-redux';
import { mainCheck, mainGetData } from 'store/main/actionCreators';
import { Modal } from 'components/common/Modal';
import { MainLayout } from 'containers/MainLayout';
import { HashRouter } from 'react-router-dom';
import { selectMain } from '../../store/main/selectors';
import { useShallowSelector } from 'hooks/useShallowSelector';

const App: React.FC = () => {
	const dispatch = useDispatch();
	const { web3 } = useShallowSelector(selectMain);

	useEffect(() => {
		debugger;
		dispatch(mainCheck());
	}, [dispatch]);

	useEffect(() => {
		debugger;
		console.log('web3 - ', web3);
		if (web3.currentProvider) {
			dispatch(mainGetData());
		}
	}, [dispatch, web3]);

	return (
		<HashRouter>
			<Modal />
			<MainLayout>
				<MainRouter />
			</MainLayout>
		</HashRouter>
	);
};

export default App;
