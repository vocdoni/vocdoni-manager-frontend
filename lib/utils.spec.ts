import { areAllNumbers, findHexId, getRandomInt, getRandomUnsplashImage, sanitizeHtml } from './util'

describe('utils', () => {
    describe('getRandomInt()', () => {
        it('returns a random int up to N', () => {
            expect(getRandomInt(10)).toBeLessThan(10)
        })
    })
    describe('getRandomUnsplashImage()', () => {
        it('returns a random image from unsplash', () => {
            const img = getRandomUnsplashImage()
            expect(img).toMatch(/^https:\/\/source\.unsplash.com\/800x600/)
        })
        it('returns a random image with the specified size', () => {
            const img = getRandomUnsplashImage('1920x1080')
            expect(img).toMatch(/^https:\/\/source\.unsplash.com\/1920x1080/)
        })
    })
    describe('allAreNumbers', () => {
        it('returns true if all slice contents are numbers', () => {
            const slice = [1, 2, 1231, 53244]
            expect(areAllNumbers(slice)).toBeTruthy()
        })
        it('returns false if any of the slice contents are not numbers', () => {
            const slice = [1, 2, 1231, 'n']
            expect(areAllNumbers(slice)).toBeFalsy()
        })
    })
    describe('findHexId', () => {
        const hexes = [
            '0x131',
            '0x221',
            '0x312',
            '0xaF1',
        ]
        const nunHex = [
            '131',
            '221',
            '312'
        ]
        it('works with prefixed slices', () => {
            let found = hexes.find(findHexId('0x131'))
            expect(found).toEqual('0x131')
            found = hexes.find(findHexId('221'))
            expect(found).toEqual('0x221')
        })
        it('works with non-prefixed slices', () => {
            let found = nunHex.find(findHexId('312'))
            expect(found).toEqual('312')
            found = nunHex.find(findHexId('221'))
            expect(found).toEqual('221')
        })
        it('works with upper and lower case', () => {
            const found = hexes.find(findHexId('aF1'))
            expect(found).toEqual('0xaF1')
        })
    })
    describe('sanitizeHtml', () => {
        it('does not remove h1 nor h2', () => {
            const text = '<h1>Heading 1</h1><h2>Heading 2</h2>'

            expect(sanitizeHtml(text)).toEqual(text)
        })
    })
})
