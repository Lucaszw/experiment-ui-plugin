var webConfig = {
  entry: './src/experiment-ui.js',
  output: {
    filename: 'experiment-ui.js',
    // use library + libraryTarget to expose module globally
    library: 'ExperimentUI',
    libraryTarget: 'var'
  }
};

module.exports = webConfig;
