import xhrInterceptor from '.'

test('says hello world', () => (
    expect(xhrInterceptor()).toBe('Hello universe')
))