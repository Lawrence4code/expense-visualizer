import database from './firebase';

const dimension = { height: 300, width: 300, radius: 150 };
const center = { x: dimension.width / 2 + 5, y: dimension.height / 2 + 5 };

// create svg container
const svg = d3
  .select('.canvas')
  .append('svg')
  .attr('width', dimension.width + 150)
  .attr('height', dimension.height + 150);

const graph = svg
  .append('g')
  .attr('transform', `translate(${center.x}, ${center.y})`);

const pie = d3
  .pie()
  .sort(null)
  .value(d => d.cost);

const arcPath = d3
  .arc()
  .outerRadius(dimension.radius)
  .innerRadius(dimension.radius / 2);

// console.log(archPath(angles[0]));

// color setup

const color = d3.scaleOrdinal(d3['schemeSet2']);

// legend setup
const legendGroup = svg
  .append('g')
  .attr('transform', `translate(${dimension.width + 70}, 90)`);

const legend = d3
  .legendColor()
  .shape('circle')
  .shapePadding(10)

  .scale(color);

// tip setup

const tip = d3
  .tip()
  .attr('class', 'tip card')
  .html(d => {
    let content = `<div class="name"> ${d.data.name} </div>`;
    content += `<div class="cost"> ${d.data.cost}</div>`;
    content += `<div class="delete"> Click Slice to delete. </div>`;
    return content;
  });

graph.call(tip);

// data array and firestore

const update = data => {
  // update color scale domain

  color.domain(data.map(d => d.name));
  // join enchanced (pie) data to path elements
  const paths = graph.selectAll('path').data(pie(data));

  // update and call legend

  legendGroup.call(legend);
  legendGroup.selectAll('text').attr('fill', '#fff');

  // hankde the exit selection
  paths
    .exit()
    .transition()
    .duration(1750)
    .attrTween('d', arcTweenExit)
    .remove();

  // handle the current path updates

  paths
    .transition()
    .duration(1750)
    .attrTween('d', arcTweenUpdate);

  paths
    .enter()
    .append('path')
    .attr('class', 'arc')
    .attr('stroke', '#fff')
    .attr('stroke-width', 3)
    .attr('d', arcPath)
    .attr('fill', d => color(d.data.name))
    .each(function(d) {
      this._current = d;
    })
    .transition()
    .duration(1750)
    .attrTween('d', arcTweenEnter);

  graph
    .selectAll('path')
    .on('mouseover', (d, i, n) => {
      tip.show(d, n[i]);
      handleMouseOver(d, i, n);
    })
    .on('mouseout', (d, i, n) => {
      tip.hide();
      handleMouseOut(d, i, n);
    })
    .on('click', handleClick);
};

// add events

// event handlers

var data = [];

database.collection('expenses').onSnapshot(res => {
  res.docChanges().forEach(change => {
    const doc = { ...change.doc.data(), id: change.doc.id };

    switch (change.type) {
      case 'added':
        data.push(doc);
        break;
      case 'modified':
        const index = data.findIndex(item => item.id === doc.id);
        data[index] = doc;
        break;
      case 'removed':
        data = data.filter(item => item.id !== doc.id);
        break;
      default:
        break;
    }
  });

  update(data);
});

const arcTweenEnter = d => {
  var i = d3.interpolate(d.endAngle, d.startAngle);
  return function(t) {
    d.startAngle = i(t);
    return arcPath(d);
  };
};

const arcTweenExit = d => {
  var i = d3.interpolate(d.startAngle, d.endAngle);
  return function(t) {
    d.startAngle = i(t);
    return arcPath(d);
  };
};

function arcTweenUpdate(d) {
  var i = d3.interpolate(this._current, d);

  this._current = i(1);

  return function(t) {
    return arcPath(i(t));
  };
}

const handleMouseOver = (d, i, n) => {
  d3.select(n[i])
    .transition('changeSliceFill')
    .duration(300)
    .attr('fill', '#fff');
};

const handleMouseOut = (d, i, n) => {
  d3.select(n[i])
    .transition('changeSliceFill')
    .duration(300)
    .attr('fill', color(d.data.name));
};

const handleClick = d => {
  const id = d.data.id;
  const result = window.confirm('Are you wanna delete?');
  if (result) {
    database
      .collection('expenses')
      .doc(id)
      .delete();
  }
};
