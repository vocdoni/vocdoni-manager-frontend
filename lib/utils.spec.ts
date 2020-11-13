import { areAllNumbers, getRandomInt, getRandomUnsplashImage } from './util'

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
})
