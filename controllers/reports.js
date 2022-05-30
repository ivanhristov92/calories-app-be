
const {getDB} = require("../database/getDb")
const { subDays, format  } = require('date-fns');

function formatDateRange(date1, date2){
    return `*|${format(date1, "yyyy-MM-dd")}|${format(date2, "yyyy-MM-dd")}|*`
  }

async function totalEntriesLastTwoWeeks(){
    let date = new Date();
    let cw = formatDateRange(subDays(new Date(date.toISOString()), 6), subDays(new Date(date.toISOString()), -1));
    let past7 = getDB()._find("Entries", {
        isoDate: cw
    })

    let wb = formatDateRange(subDays(new Date(date.toISOString()), 14), subDays(new Date(date.toISOString()), 6))
    let weekBefore = getDB()._find("Entries", {
        isoDate: wb
    });

    let res = await Promise.all([past7, weekBefore]);

    return {
        past7: res[0].total,
        weekBefore: res[1].total,
        dates: {cw, wb}
    }

}


async function avgCaloriesPerUserLastWeek({after, before} = {}){
    before = format(subDays(new Date(), -1), "yyyy-MM-dd") + `T00:00:00.000Z`;
    after = format(subDays(new Date(), 6), "yyyy-MM-dd") + `T00:00:00.000Z`
    console.log("running report: avgCaloriesPerUserLastWeek", before, after);

    let result;

    let _query = `
        SELECT 
        c.userId,
        count(c.id) as "totalEntries", 
        sum(StringToNumber(c.calories)) as "totalCalories",
        avg(StringToNumber(c.calories)) as "averageCalories"
        FROM c
        where c.lastModified < @before
        and c.lastModified > @after
        group by c.userId`

    try {
        const { resources: results } = await getDB().client
        .database(getDB().database)
        .container("Entries")
        .items.query({
        query: _query,
        parameters: [
            {name: "@before", value: before},
            {name: "@after", value: after}
        ]
        })
        .fetchAll()

          console.log(results, _query)
         result = results;
        } catch (error) {
            console.log(error)
            result = false;
        }
        if (!result) throw Error('Error executing report');
        return result;
    
}


module.exports =  {
    get(id){},
    run(id){
        if(id==="totalEntriesLastTwoWeeks"){
            return totalEntriesLastTwoWeeks();
        } else if (id === "avgCaloriesPerUserLastWeek"){
            return avgCaloriesPerUserLastWeek();
        }
    },
    create(){}
}