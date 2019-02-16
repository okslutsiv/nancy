import test from 'ava';
import {Nancy, states} from '.';

test('empty executor results in a pending promise', t => {
	const p = new Nancy(() => {});
	t.is(p.state, states.pending);
});

const throwSomethingWrong = () => {
	throw new Error('Something went wrong...');
};

test('error thrown during resolve execution results in a rejected promise', t => {
	const p = new Nancy(throwSomethingWrong);
	t.is(p.state, states.rejected);
});

test('simple resolve and reject works', t => {
	let p = Nancy.resolve(42);
	t.is(p.state, states.resolved);
	t.is(p.value, 42);
	p = Nancy.reject(42);
	t.is(p.state, states.rejected);
	t.is(p.value, 42);
});

test('chain then sync', t => {
	let p = Nancy.reject(42)
		.then(() => 0)
		.then(() => 1)
		.then(() => 2);
	t.is(p.state, states.rejected);
	t.is(p.value, 42);

	p = Nancy.resolve(0)
		.then(value => {
			t.is(value, 0);
			return 1;
		})
		.then(value => {
			t.is(value, 1);
			return 2;
		})
		.then(throwSomethingWrong);
	t.is(p.state, states.rejected);
});

const anything = () => {
	throw new Error('I can be anything because I should never get called!');
};

test.cb('chain catch sync', t => {
	Nancy.reject(42)
		.catch(error => error)
		.catch(anything)
		.then(throwSomethingWrong)
		.catch(throwSomethingWrong)
		.catch(() => t.end());
});

test('subsequent resolves and rejects are ignored', t => {
	const p = new Nancy((resolve, reject) => {
		reject(42);
		resolve(24);
		reject();
	});
	t.is(p.state, states.rejected);
	t.is(p.value, 42);
});
