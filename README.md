# webpack css + splitChunks: red or blue?

| No. | import       | css     | splitChunks chunks | splitChunks priority | color |
| --- | ------------ | ------- | ------------------ | -------------------- | ----- |
| 0   | style-loader | static  | all                | a = b                | blue  |
| 1   | style-loader | static  | all                | a > b                | blue  |
| 2   | style-loader | static  | all                | a < b                | blue  |
| 3   | style-loader | static  | async              | a = b                | blue  |
| 4   | style-loader | static  | async              | a > b                | blue  |
| 5   | style-loader | static  | async              | a < b                | blue  |
| 6   | style-loader | dynamic | all                | a = b                | blue  |
| 7   | style-loader | dynamic | all                | a > b                | blue  |
| 8   | style-loader | dynamic | all                | a < b                | blue  |
| 9   | style-loader | dynamic | async              | a = b                | blue  |
| 10  | style-loader | dynamic | async              | a > b                | blue  |
| 11  | style-loader | dynamic | async              | a < b                | blue  |
| 12  | experiments  | static  | all                | a = b                | red   |
| 13  | experiments  | static  | all                | a > b                | blue  |
| 14  | experiments  | static  | all                | a < b                | red   |
| 15  | experiments  | static  | async              | a = b                | blue  |
| 16  | experiments  | static  | async              | a > b                | blue  |
| 17  | experiments  | static  | async              | a < b                | blue  |
| 18  | experiments  | dynamic | all                | a = b                | red   |
| 19  | experiments  | dynamic | all                | a > b                | blue  |
| 20  | experiments  | dynamic | all                | a < b                | red   |
| 21  | experiments  | dynamic | async              | a = b                | red   |
| 22  | experiments  | dynamic | async              | a > b                | blue  |
| 23  | experiments  | dynamic | async              | a < b                | red   |
| 24  | mini-css     | static  | all                | a = b                | red   |
| 25  | mini-css     | static  | all                | a > b                | blue  |
| 26  | mini-css     | static  | all                | a < b                | red   |
| 27  | mini-css     | static  | async              | a = b                | blue  |
| 28  | mini-css     | static  | async              | a > b                | blue  |
| 29  | mini-css     | static  | async              | a < b                | blue  |
| 30  | mini-css     | dynamic | all                | a = b                | red   |
| 31  | mini-css     | dynamic | all                | a > b                | blue  |
| 32  | mini-css     | dynamic | all                | a < b                | red   |
| 33  | mini-css     | dynamic | async              | a = b                | red   |
| 34  | mini-css     | dynamic | async              | a > b                | blue  |
| 35  | mini-css     | dynamic | async              | a < b                | red   |

# Why?

TODO
