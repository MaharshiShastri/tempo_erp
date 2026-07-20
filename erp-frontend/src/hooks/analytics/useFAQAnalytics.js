import { useMemo } from "react";

export default function useFAQAnalytics({salesKpis = [], rndKpis = []}) {

    return useMemo(() => {

        const totalFaqAsked = salesKpis.reduce((sum, x) => sum + Number(x.faqs_asked || 0),0);

        const totalFaqAnswered = rndKpis.reduce((sum, x) => sum + Number(x.faqs_answered || 0),0);

        const pendingFaqs = totalFaqAsked - totalFaqAnswered;

        const salesRanking = [...salesKpis].sort((a, b) =>b.activity_score - a.activity_score);

        const rndRanking = [...rndKpis].sort((a, b) =>b.knowledge_score - a.knowledge_score);

        const faqAskedChart = {

            labels: salesKpis.map(x => x.name),

            datasets: [

                {

                    label: "Questions Asked",

                    data:salesKpis.map(x => Number(x.faqs_asked)),

                    backgroundColor: "#FF9800"

                }

            ]

        };

        const faqAnswerChart = {

            labels: rndKpis.map(x => x.name),

            datasets: [

                {

                    label: "Knowledge Score",

                    data: rndKpis.map(x => Number(x.knowledge_score)),

                    backgroundColor: "#4CAF50"

                }

            ]

        };

        return {totalFaqAsked, totalFaqAnswered, pendingFaqs, salesRanking, rndRanking, faqAskedChart, faqAnswerChart};

    }, [salesKpis, rndKpis]);

}