/**
 * Test suite for Daily Puzzle Game
 * Run with: node tests/puzzle.test.js
 */

// ============================================
// MOCK FUNCTIONS (copied from puzzle-db.js for testing)
// ============================================

const FALLBACK_PUZZLES = [
	{
		clues: [
			{ hint: "A round fruit that keeps the doctor away", answer: "apple" },
			{ hint: "A company founded by Steve Jobs", answer: "apple" },
			{ hint: "The Big _____ (nickname for New York City)", answer: "apple" }
		],
		link: { hint: "What word connects all three clues?", answer: "apple" }
	},
	{
		clues: [
			{ hint: "Earth's natural satellite", answer: "moon" },
			{ hint: "To show your backside in public", answer: "moon" },
			{ hint: "_____ River (a famous song)", answer: "moon" }
		],
		link: { hint: "What word connects all three clues?", answer: "moon" }
	}
];

function getDateString(date = new Date()) {
	return date.toISOString().split('T')[0];
}

function getFallbackPuzzleIndex(dateStr) {
	let hash = 0;
	for (let i = 0; i < dateStr.length; i++) {
		const char = dateStr.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash;
	}
	return Math.abs(hash) % FALLBACK_PUZZLES.length;
}

function normalizeAnswer(answer) {
	if (typeof answer !== 'string') return '';
	return answer.toLowerCase().trim();
}

function transformDBPuzzle(row) {
	return {
		date: row.puzzle_date,
		clues: [
			{ hint: row.clue1_hint, answer: row.clue1_answer },
			{ hint: row.clue2_hint, answer: row.clue2_answer },
			{ hint: row.clue3_hint, answer: row.clue3_answer }
		],
		link: { hint: row.link_hint, answer: row.link_answer }
	};
}

// ============================================
// TEST UTILITIES
// ============================================

let testsRun = 0;
let testsPassed = 0;

function test(name, fn) {
	testsRun++;
	try {
		fn();
		testsPassed++;
		console.log(`  ✓ ${name}`);
	} catch (e) {
		console.log(`  ✗ ${name}`);
		console.log(`    Error: ${e.message}`);
	}
}

function assertEqual(actual, expected, message = '') {
	if (actual !== expected) {
		throw new Error(`${message} Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
	}
}

function assertTrue(condition, message = '') {
	if (!condition) {
		throw new Error(message || 'Expected true, got false');
	}
}

function assertDeepEqual(actual, expected, message = '') {
	const actualStr = JSON.stringify(actual);
	const expectedStr = JSON.stringify(expected);
	if (actualStr !== expectedStr) {
		throw new Error(`${message} Expected ${expectedStr}, got ${actualStr}`);
	}
}

// ============================================
// TESTS
// ============================================

console.log('\n🧪 Running Puzzle Game Tests\n');

console.log('📅 Date Functions:');

test('getDateString returns correct format', () => {
	const date = new Date('2024-01-15T12:00:00Z');
	assertEqual(getDateString(date), '2024-01-15');
});

test('getDateString returns consistent format', () => {
	const result = getDateString();
	assertTrue(/^\d{4}-\d{2}-\d{2}$/.test(result), 'Should match YYYY-MM-DD format');
});

console.log('\n🎯 Puzzle Index Functions:');

test('getFallbackPuzzleIndex returns valid index', () => {
	const index = getFallbackPuzzleIndex('2024-01-15');
	assertTrue(index >= 0 && index < FALLBACK_PUZZLES.length, 'Index should be within bounds');
});

test('getFallbackPuzzleIndex is deterministic', () => {
	const index1 = getFallbackPuzzleIndex('2024-01-15');
	const index2 = getFallbackPuzzleIndex('2024-01-15');
	assertEqual(index1, index2, 'Same date should return same index');
});

test('getFallbackPuzzleIndex varies by date', () => {
	const indices = new Set();
	for (let i = 1; i <= 30; i++) {
		const dateStr = `2024-01-${i.toString().padStart(2, '0')}`;
		indices.add(getFallbackPuzzleIndex(dateStr));
	}
	assertTrue(indices.size > 1, 'Different dates should produce different indices');
});

console.log('\n✏️ Answer Normalization:');

test('normalizeAnswer handles lowercase', () => {
	assertEqual(normalizeAnswer('APPLE'), 'apple');
});

test('normalizeAnswer handles mixed case', () => {
	assertEqual(normalizeAnswer('ApPlE'), 'apple');
});

test('normalizeAnswer handles whitespace', () => {
	assertEqual(normalizeAnswer('  apple  '), 'apple');
});

test('normalizeAnswer handles combined issues', () => {
	assertEqual(normalizeAnswer('  APPLE  '), 'apple');
});

test('normalizeAnswer handles empty string', () => {
	assertEqual(normalizeAnswer(''), '');
});

test('normalizeAnswer handles non-string input', () => {
	assertEqual(normalizeAnswer(null), '');
	assertEqual(normalizeAnswer(undefined), '');
	assertEqual(normalizeAnswer(123), '');
});

console.log('\n🔍 Puzzle Data Validation:');

test('All fallback puzzles have correct structure', () => {
	FALLBACK_PUZZLES.forEach((puzzle, i) => {
		assertTrue(Array.isArray(puzzle.clues), `Puzzle ${i}: clues should be an array`);
		assertEqual(puzzle.clues.length, 3, `Puzzle ${i}: should have 3 clues`);
		assertTrue(puzzle.link !== undefined, `Puzzle ${i}: should have a link`);
		assertTrue(typeof puzzle.link.hint === 'string', `Puzzle ${i}: link should have hint`);
		assertTrue(typeof puzzle.link.answer === 'string', `Puzzle ${i}: link should have answer`);
	});
});

test('All clues have hint and answer', () => {
	FALLBACK_PUZZLES.forEach((puzzle, pIdx) => {
		puzzle.clues.forEach((clue, cIdx) => {
			assertTrue(typeof clue.hint === 'string' && clue.hint.length > 0,
				`Puzzle ${pIdx}, Clue ${cIdx}: should have non-empty hint`);
			assertTrue(typeof clue.answer === 'string' && clue.answer.length > 0,
				`Puzzle ${pIdx}, Clue ${cIdx}: should have non-empty answer`);
		});
	});
});

console.log('\n🎮 Answer Matching:');

test('Correct answer matches (exact)', () => {
	const puzzle = FALLBACK_PUZZLES[0];
	const userAnswer = normalizeAnswer('apple');
	const correctAnswer = normalizeAnswer(puzzle.clues[0].answer);
	assertEqual(userAnswer, correctAnswer);
});

test('Correct answer matches (case insensitive)', () => {
	const puzzle = FALLBACK_PUZZLES[0];
	const userAnswer = normalizeAnswer('APPLE');
	const correctAnswer = normalizeAnswer(puzzle.clues[0].answer);
	assertEqual(userAnswer, correctAnswer);
});

test('Incorrect answer does not match', () => {
	const puzzle = FALLBACK_PUZZLES[0];
	const userAnswer = normalizeAnswer('banana');
	const correctAnswer = normalizeAnswer(puzzle.clues[0].answer);
	assertTrue(userAnswer !== correctAnswer, 'Wrong answer should not match');
});

test('Answer with extra spaces matches', () => {
	const puzzle = FALLBACK_PUZZLES[0];
	const userAnswer = normalizeAnswer('  apple  ');
	const correctAnswer = normalizeAnswer(puzzle.clues[0].answer);
	assertEqual(userAnswer, correctAnswer);
});

console.log('\n🗄️ Database Transform:');

test('transformDBPuzzle converts database row correctly', () => {
	const dbRow = {
		puzzle_date: '2024-01-15',
		clue1_hint: 'Hint 1',
		clue1_answer: 'answer1',
		clue2_hint: 'Hint 2',
		clue2_answer: 'answer2',
		clue3_hint: 'Hint 3',
		clue3_answer: 'answer3',
		link_hint: 'Link hint',
		link_answer: 'link'
	};

	const result = transformDBPuzzle(dbRow);

	assertEqual(result.date, '2024-01-15');
	assertEqual(result.clues.length, 3);
	assertEqual(result.clues[0].hint, 'Hint 1');
	assertEqual(result.clues[0].answer, 'answer1');
	assertEqual(result.clues[1].hint, 'Hint 2');
	assertEqual(result.clues[1].answer, 'answer2');
	assertEqual(result.clues[2].hint, 'Hint 3');
	assertEqual(result.clues[2].answer, 'answer3');
	assertEqual(result.link.hint, 'Link hint');
	assertEqual(result.link.answer, 'link');
});

test('transformDBPuzzle preserves all data', () => {
	const dbRow = {
		puzzle_date: '2024-12-25',
		clue1_hint: 'A festive tree',
		clue1_answer: 'christmas',
		clue2_hint: 'December 25th holiday',
		clue2_answer: 'christmas',
		clue3_hint: '_____ Carol (Dickens story)',
		clue3_answer: 'christmas',
		link_hint: 'What holiday connects them?',
		link_answer: 'christmas'
	};

	const result = transformDBPuzzle(dbRow);

	assertTrue(result.clues.every(c => c.answer === 'christmas'), 'All answers should be christmas');
	assertEqual(result.link.answer, 'christmas');
});

console.log('\n🔄 Fallback Mechanism:');

test('Fallback puzzles cover multiple dates', () => {
	const puzzlesByIndex = {};
	for (let month = 1; month <= 12; month++) {
		for (let day = 1; day <= 28; day++) {
			const dateStr = `2024-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
			const index = getFallbackPuzzleIndex(dateStr);
			puzzlesByIndex[index] = (puzzlesByIndex[index] || 0) + 1;
		}
	}
	// All puzzle indices should be used
	const usedIndices = Object.keys(puzzlesByIndex).length;
	assertTrue(usedIndices === FALLBACK_PUZZLES.length, `All ${FALLBACK_PUZZLES.length} fallback puzzles should be used`);
});

test('Same date always returns same fallback puzzle', () => {
	const date = '2024-06-15';
	const index1 = getFallbackPuzzleIndex(date);
	const index2 = getFallbackPuzzleIndex(date);
	const index3 = getFallbackPuzzleIndex(date);
	assertEqual(index1, index2);
	assertEqual(index2, index3);
});

// ============================================
// SUMMARY
// ============================================

console.log('\n' + '='.repeat(40));
console.log(`Tests: ${testsPassed}/${testsRun} passed`);

if (testsPassed === testsRun) {
	console.log('✅ All tests passed!\n');
	process.exit(0);
} else {
	console.log(`❌ ${testsRun - testsPassed} test(s) failed\n`);
	process.exit(1);
}
