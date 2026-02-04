/**
 * Test suite for Daily Puzzle Game
 * Run with: node tests/puzzle.test.js
 */

// ============================================
// MOCK FUNCTIONS (copied from puzzle.html for testing)
// ============================================

const PUZZLES = [
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

function getDailyPuzzleIndex(dateStr) {
	let hash = 0;
	for (let i = 0; i < dateStr.length; i++) {
		const char = dateStr.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash;
	}
	return Math.abs(hash) % PUZZLES.length;
}

function normalizeAnswer(answer) {
	if (typeof answer !== 'string') return '';
	return answer.toLowerCase().trim();
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

test('getDailyPuzzleIndex returns valid index', () => {
	const index = getDailyPuzzleIndex('2024-01-15');
	assertTrue(index >= 0 && index < PUZZLES.length, 'Index should be within bounds');
});

test('getDailyPuzzleIndex is deterministic', () => {
	const index1 = getDailyPuzzleIndex('2024-01-15');
	const index2 = getDailyPuzzleIndex('2024-01-15');
	assertEqual(index1, index2, 'Same date should return same index');
});

test('getDailyPuzzleIndex varies by date', () => {
	// Test multiple dates to ensure variation
	const indices = new Set();
	for (let i = 1; i <= 30; i++) {
		const dateStr = `2024-01-${i.toString().padStart(2, '0')}`;
		indices.add(getDailyPuzzleIndex(dateStr));
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

test('All puzzles have correct structure', () => {
	PUZZLES.forEach((puzzle, i) => {
		assertTrue(Array.isArray(puzzle.clues), `Puzzle ${i}: clues should be an array`);
		assertEqual(puzzle.clues.length, 3, `Puzzle ${i}: should have 3 clues`);
		assertTrue(puzzle.link !== undefined, `Puzzle ${i}: should have a link`);
		assertTrue(typeof puzzle.link.hint === 'string', `Puzzle ${i}: link should have hint`);
		assertTrue(typeof puzzle.link.answer === 'string', `Puzzle ${i}: link should have answer`);
	});
});

test('All clues have hint and answer', () => {
	PUZZLES.forEach((puzzle, pIdx) => {
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
	const puzzle = PUZZLES[0];
	const userAnswer = normalizeAnswer('apple');
	const correctAnswer = normalizeAnswer(puzzle.clues[0].answer);
	assertEqual(userAnswer, correctAnswer);
});

test('Correct answer matches (case insensitive)', () => {
	const puzzle = PUZZLES[0];
	const userAnswer = normalizeAnswer('APPLE');
	const correctAnswer = normalizeAnswer(puzzle.clues[0].answer);
	assertEqual(userAnswer, correctAnswer);
});

test('Incorrect answer does not match', () => {
	const puzzle = PUZZLES[0];
	const userAnswer = normalizeAnswer('banana');
	const correctAnswer = normalizeAnswer(puzzle.clues[0].answer);
	assertTrue(userAnswer !== correctAnswer, 'Wrong answer should not match');
});

test('Answer with extra spaces matches', () => {
	const puzzle = PUZZLES[0];
	const userAnswer = normalizeAnswer('  apple  ');
	const correctAnswer = normalizeAnswer(puzzle.clues[0].answer);
	assertEqual(userAnswer, correctAnswer);
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
