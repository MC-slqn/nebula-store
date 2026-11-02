jest.mock('../../model/index', () => ({
    dbsql: jest.fn()
}))

const { dbsql } = require('../../model/index')
const { showBannerList } = require('../bannerCtrl')

describe('bannerCtrl', () => {
    let req, res

    beforeEach(() => {
        req = {}
        res = { send: jest.fn(), status: jest.fn().mockReturnThis() }
        dbsql.mockClear()
    })

    describe('showBannerList', () => {
        it('should query banners with ORDER BY sort DESC', () => {
            showBannerList(req, res)

            const sql = dbsql.mock.calls[0][0]
            expect(sql).toContain('SELECT * FROM banners')
            expect(sql).toContain('ORDER BY sort DESC')
        })

        it('should pass empty params array', () => {
            showBannerList(req, res)

            const params = dbsql.mock.calls[0][1]
            expect(params).toEqual([])
        })

        it('should return data array on success', () => {
            const mockResults = [{ id: 1, image_url: '/img/b1.jpg', sort: 10 }]
            dbsql.mockImplementation((sql, params, cb) => cb(null, mockResults))

            showBannerList(req, res)

            expect(res.send).toHaveBeenCalledWith({
                code: 200,
                message: null,
                data: mockResults
            })
        })
    })
})
