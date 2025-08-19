/**
 * Simple tests for Simple Gifting utilities
 * Run these in browser console to verify functionality
 */

// Test formatMoney function
console.group('🧪 Testing formatMoney function');
try {
  const testCases = [
    { input: 1000, expected: '€10,00' },
    { input: 1550, expected: '€15,50' },
    { input: 0, expected: '€0,00' },
    { input: 99, expected: '€0,99' }
  ];

  testCases.forEach(({ input, expected }) => {
    const result = SimpleGifting.utils.formatMoney(input);
    console.log(`formatMoney(${input}) = ${result} ${result === expected ? '✅' : '❌'}`);
  });
} catch (error) {
  console.error('❌ formatMoney test failed:', error);
}
console.groupEnd();

// Test sanitizeHtml function
console.group('🧪 Testing sanitizeHtml function');
try {
  const testCases = [
    { input: '<script>alert("xss")</script>Hello', expected: 'Hello' },
    { input: 'Safe text', expected: 'Safe text' },
    { input: '<img src="x" onerror="alert(1)">', expected: '' }
  ];

  testCases.forEach(({ input, expected }) => {
    const result = SimpleGifting.utils.sanitizeHtml(input);
    console.log(`sanitizeHtml("${input}") = "${result}" ${result === expected ? '✅' : '❌'}`);
  });
} catch (error) {
  console.error('❌ sanitizeHtml test failed:', error);
}
console.groupEnd();

// Test validateEmail function
console.group('🧪 Testing validateEmail function');
try {
  const testCases = [
    { input: 'test@example.com', expected: true },
    { input: 'invalid-email', expected: false },
    { input: 'user@domain', expected: false },
    { input: '@domain.com', expected: false }
  ];

  testCases.forEach(({ input, expected }) => {
    const result = SimpleGifting.utils.validateEmail(input);
    console.log(`validateEmail("${input}") = ${result} ${result === expected ? '✅' : '❌'}`);
  });
} catch (error) {
  console.error('❌ validateEmail test failed:', error);
}
console.groupEnd();

// Test debounce function
console.group('🧪 Testing debounce function');
try {
  let callCount = 0;
  const debouncedFn = SimpleGifting.utils.debounce(() => {
    callCount++;
  }, 100);

  // Call multiple times quickly
  debouncedFn();
  debouncedFn();
  debouncedFn();

  setTimeout(() => {
    console.log(`Debounce test: ${callCount === 1 ? '✅' : '❌'} (called ${callCount} times, expected 1)`);
  }, 150);
} catch (error) {
  console.error('❌ debounce test failed:', error);
}
console.groupEnd();

console.log('🎉 All tests completed! Check the results above.');
