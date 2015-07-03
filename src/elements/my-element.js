'use strict';
var options = { style: 'currency', currency: 'USD' };
var numberFormat = new Intl.NumberFormat('en-US', options);
var model = {
  observe: {
    totalExpensesPerMonth: 'drawChart',
    grossIncomePerMonth: 'drawChart',
    return: 'drawChart',
    inflation: 'drawChart',
    retireAge: 'drawChart',
    birthdate: 'drawChart',
    death: 'drawChart'
  },

  totalExpensesPerMonth: 1000,
  grossIncomePerMonth: 3000,
  get netIncomePerMonth () {
    return this.grossIncomePerMonth - this.totalExpensesPerMonth;
  },

  return: 1.2,
  inflation: 1.03,
  death: 37,
  retireAge: 35,
  birthdate: '1987-01-01',
  seed: 10000,
  year: 0,
  get dNow () {
    return new Date();
  },

  get bdate () {
    var offset = this.dNow.getTimezoneOffset() / 60;
    return new Date(this.birthdate + 'T00:00:00-0' + offset + ':00');
  },

  get retireYear () {
    return this.bdate.getUTCFullYear() + this.retireAge;
  },

  get yearsFromNow () {
    return this.retireYear - this.dNow.getUTCFullYear();
  },

  getXYearsInFuture: function (years, x, grow) {
    return x * Math.pow(grow || this.inflation, years);
  },

  growth: function growth (savings0, feed, inflation, grow, year) {
    var key = '' + savings0 + feed + inflation + grow + year;
    if (this.fm[key]) {
      return this.fm[key];
    }
    if (!year) {
      return savings0;
    }
    return this.growth(savings0, feed, inflation, grow, year - 1) * grow +
      Math.pow(inflation, year) * feed;
  },

  fm: {},

  fall: function fall (savings0, expenses0, k) {
    var key = '' + savings0 + expenses0 + k;
    if (this.fm[key]) {
      return this.fm[key];
    }
    if ( k === 0) {
      return savings0;
    }

    return (this.fm[key] = (this.fall(savings0, expenses0, k - 1) - expenses0 * Math.pow(this.inflation, k)) * this.return);
  },

  get inflSum () {
    return this.growth(12 * this.netIncomePerMonth, this.inflation, this.yearsFromNow);
  },

  get stockMSum () {
    return this.growth(12 * this.netIncomePerMonth, this.return, this.yearsFromNow);
  },

  currency: ammount => numberFormat.format(ammount),

  drawChart: function () {
    // Create the data table.
    var data = new google.visualization.DataTable();
    data.addColumn('number', 'years from now');
    data.addColumn('number', 'gross income');
    data.addColumn('number', 'expenses');
    data.addColumn('number', 'total savings');
    data.addColumn('number', 'total invested');

    var rows = [];
    // savings0, feed, inflation, grow, year
    for (var i=0; i < this.yearsFromNow; i++) {
      rows.push([
        i,
        this.getXYearsInFuture(i, 12 * this.grossIncomePerMonth),
        this.getXYearsInFuture(i, 12 * this.totalExpensesPerMonth),
        this.growth(this.seed, 12 * this.netIncomePerMonth, this.inflation, this.inflation, i),
        this.growth(this.seed, 12 * this.netIncomePerMonth, this.inflation, this.return, i)
      ]);
      console.log(
        this.growth(this.seed, 12 * this.netIncomePerMonth, this.inflation, this.return, i)
      );
    }
    
    var finalbalance = this.growth(this.seed, 12 * this.netIncomePerMonth, this.inflation, this.return, i - 1);
    var finalsavings = this.growth(this.seed, 12 * this.netIncomePerMonth, this.inflation, this.inflation, i - 1);
    var initexp = this.getXYearsInFuture(i - 1, 12 * this.totalExpensesPerMonth);
    console.log('f', finalbalance, initexp);
    for (var terminous = this.yearsFromNow + this.death - this.retireAge + 1; i<terminous; i++) {
      console.log(i - this.yearsFromNow);
      rows.push([
        i,
        null,
        this.getXYearsInFuture(i, 12 * this.totalExpensesPerMonth),
        this.fall(finalsavings, initexp, i - this.yearsFromNow + 1),
        this.fall(finalbalance, initexp, i - this.yearsFromNow + 1)
      ]);
      console.log(this.fall(finalbalance, initexp, i - this.yearsFromNow));
    }
    data.addRows(rows);

    var options = {
      title: 'foo',
      hAxis: {
        title: 'Time'
      },

      vAxis: {
        title: 'Popularity'
      },

      colors: ['#a52714', '#097138', '#bada55', '#deadbe'],
      height: 1000
    };


    // Instantiate and draw our chart, passing in some options.
    var chart = new google.charts.Line(this.$.foo);
    chart.draw(data, options);
  },

  domReady: function () {
    google.setOnLoadCallback(this.drawChart.bind(this));
    if (window.gchartsLoaded) {
      this.drawChart();
    }
  }
};

Polymer('my-element', model);
