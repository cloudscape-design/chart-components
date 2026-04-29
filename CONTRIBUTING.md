# Contributing Guidelines

For more information on our support model, versioning, browsers and frameworks support, visit our [main components repository contributing guidelines](https://github.com/cloudscape-design/components/blob/main/CONTRIBUTING.md).


## How to contribute code

Currently we only accept code contributions for bug fixes. A code owner will review the pull request and merge it. Once we merge a pull request, we run additional testing internally before publishing artifacts to npm.


## Highcharts pitfalls

### Never access `series.data` directly

Highcharts has a performance optimization called [`cropThreshold`](https://api.highcharts.com/highcharts/plotOptions.series.cropThreshold) (default: 300 for line series, 50 for column/bar). When a series exceeds this threshold **and** the axis extremes are narrower than the full data range, Highcharts allocates `series.data` to full length but only populates elements from `cropStart` onward — earlier indexes are `undefined`.

Accessing `series.data` directly (e.g., `.find()`, `.forEach()`, index access) will crash on these `undefined` entries.

**Do this instead:**

```ts
import { getSeriesData } from "../internal/utils/highcharts";

// Safe — filters out undefined/destroyed points
for (const point of getSeriesData(series)) { ... }

// Unsafe — will crash with >300 points and narrowed axis
(series as Series).data.find(d => d.x === target);
```

The `SafeSeries` type omits `.data` so TypeScript prevents direct access.



## Code of Conduct
This project has adopted the [Amazon Open Source Code of Conduct](https://aws.github.io/code-of-conduct).
For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq) or contact
opensource-codeofconduct@amazon.com with any additional questions or comments.


## Security issue notifications
If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our [vulnerability reporting page](http://aws.amazon.com/security/vulnerability-reporting/). Please do **not** create a public github issue.


## Licensing

See the [LICENSE](LICENSE) file for our project's licensing. We will ask you to confirm the licensing of your contribution.
