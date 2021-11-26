# lighthouse_usage

## init install

```
$ npm i
```

## need file

```bash
$ cp .env.sample .env
$ cp url.csv.sample url.csv
```

### run

```
$ node lh.js
```


### report

```
$ tree

report/
└── 20210819022853
    ├── Login
    │   ├── report-0001.json
    │   ├── report-0002.json
    │   ~~~~~
    └── NoLogin
        ├── report-0001.json
        ├── report-0002.json
        ~~~~~
```