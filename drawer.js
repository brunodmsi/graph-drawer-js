var width     = 960;
var height    = 500;
var colors    = d3.scale.category10();

var svg       = d3.select('body')
                  .append('svg')
                  .attr('width', width)
                  .attr('height', height);

var countNodeId = new Array(200);
for(var i = countNodeId.length; i >= 0; -- i) countNodeId[i] = 0;
countNodeId[0]++;
countNodeId[1]++;
countNodeId[2]++;

var nodes = [
  { id: 0, x: 100, y: 100 },  
  { id: 1, x: 200, y: 200 }, 
  { id: 2, x: 300, y: 300 },
];

var links = [
  { source: nodes[0], target: nodes[1] },
  { source: nodes[1], target: nodes[2] },
];

var lastNodeId = nodes[2].id + 1;

var drag_line = svg.append('svg:path')
                    .attr('class', 'link dragline hidden')
                    .attr('d', 'M0,0L0,0');

var path, circle;

var selected_node   = null,
    selected_link   = null,
    mousedown_link  = null,
    mousedown_node  = null,
    mouseup_node    = null;

function resetMouseVars() {
  mousedown_node    = null;
  mouseup_node      = null;
  mousedown_link    = null;
}

function restart() {
  svg.selectAll('g').remove();

  path    = svg.append('svg:g').selectAll('path');
  circle  = svg.append('svg:g').selectAll('g');

  circle  = circle.data(nodes, function(d) { return d.id; });
  circle.selectAll('circle')
        .style('fill', function(d) {
          return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id);
        });

  var g = circle.enter().append('svg:g');

  g.append('svg:circle')
   .attr('class', 'node')
   .attr('r', 12)
   .attr('cx', function(d) { return d.x; })
   .attr('cy', function(d) { return d.y; })
   .style('fill', function(d) {
     return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id);
    })
   .style('stroke', function(d) { return d3.rgb(colors(d.id)).darker().toString(); })

   .on('mousedown', function(d) {
     if(d3.event.ctrlKey) return;

     mousedown_node = d;
     if(mousedown_node === selected_node) selected_node = null;
     else selected_node = mousedown_node;

     selected_link = null;

     drag_line
        .classed('hidden', false)
        .attr('d', 'M'+ mousedown_node.x +','+ mousedown_node.y +'L'+ mousedown_node.x +','+ mousedown_node.y);
      restart();
   })

   .on('mouseup', function(d) {
     if(!mousedown_node) return;

     drag_line.classed('hidden', true);

     mouseup_node = d;
     if(mouseup_node === mousedown_node) { resetMouseVars(); return; }

     var source, target, direction;
     if(mouseup_node.id < mouseup_node.id) {
       source = mousedown_node;
       target = mouseup_node;
     } else {
       source = mouseup_node;
       target = mousedown_node;
     }

     var link;
     link = links.filter(function(l) {
       return (l.source === source && l.target === target);
     })[0];

     if(link) {
       //link[direction] = true;
     } else {
       link = { source: source, target: target };
       links.push(link);
     }

     selected_link = link;
     selected_node = null;

     restart();
   })
  ;
  
  g.append('svg:text')
   .attr('x', function(d) { return d.x; })
   .attr('y', function(d) { return d.y; })
   .attr('class', 'id')
   .text(function(d) { return d.id; });

  path = path.data(links);
  path.classed('selected', function(d) { return d === selected_link; });

  path.enter().append('svg:path')
      .attr('class', 'link')
      .classed('seleced', function(d) { return d === selected_link; })

      .attr('d', function(d) {
        var deltaX        = d.target.x - d.source.x,
            deltaY        = d.target.y - d.source.y,

            dist          = Math.sqrt(deltaX * deltaX + deltaY * deltaY),

            normX         = deltaX / dist,
            normY         = deltaY / dist,

            sourcePadding = 12,
            targetPadding = 12,

            sourceX       = d.source.x + (sourcePadding * normX),
            sourceY       = d.source.y + (sourcePadding * normY),

            targetX       = d.target.x - (targetPadding * normX),
            targetY       = d.target.y - (targetPadding * normY);

            return 'M'+ sourceX +','+ sourceY +'L'+ targetX +','+ targetY;
      })
      
      .on('mousedown', function(d) {
        if(d3.event.ctrlKey) return;

        mousedown_link = d;
        if(mousedown_link === selected_link) selected_link = null;
        else selected_link = mousedown_link;
        selected_node = null;
        restart();
      })
  ;
}

function mousedown() {
  svg.classed('active', true);

  if(d3.event.ctrlKey || mousedown_node || mousedown_link) return;

  var point  =   d3.mouse(this),
      node   = { id: lastNodeId };

  countNodeId[lastNodeId]++;
  for(var i = 0; i < 200; i++) {
    if(countNodeId[i] === 0) {
      lastNodeId = i;
      break;
    }
  }

  node.x = point[0];
  node.y = point[1];
  nodes.push(node);

  restart();
}

function mousemove() {
  if(!mousedown_node) return;

  drag_line
  .attr('d','M'+ mousedown_node.x +','+ mousedown_node.y +'L'+ d3.mouse(this)[0] +','+ d3.mouse(this)[1]);

  restart();
}

function mouseup() {
  if(mousedown_node) {
    drag_line
      .classed('hidden', true);
  }

  svg.classed('active', false);

  resetMouseVars();
}

function spliceLinksForNode(node) {
  var toSplice = links.filter(function(l) {
    return (l.source === node || l.target === node);
  });

  toSplice.map(function(l) {
    links.splice(links.indexOf(l), 1);
  });
}

var lastKeyDown = -1;

var drag = d3.behavior.drag()
    .on('drag', function(d) {
      console.log('arrastando...');

      var dragTarget = d3.select(this).select('circle');

      var new_cx, new_cy;

      dragTarget.attr('cx', function() {
        new_cx = d3.event.dx + parseInt(dragTarget.attr('cx'));
        return new_cx;
      })
      .attr('cy', function() {
        new_cy = d3.event.dy + parseInt(dragTarget.attr('cy'));
        return new_cy;
      });

      d.x = new_cx;
      d.y = new_cy;

      restart();
    });

function move() {}

function keydown() {
  d3.event.preventDefault();

  lastKeyDown = d3.event.keyCode;

  if(d3.event.keyCode === 17) {
    circle.call(drag);
    svg.classed('ctrl', true);
  }

  if(!selected_node && !selected_link) return;

  switch(d3.event.keyCode) {
    case 46:
      if(selected_node) {
        nodes.splice(nodes.indexOf(selected_node), 1);
        spliceLinksForNode(selected_node);
        countNodeId[selected_node.id] = 0;
        for(var i = 0; i < 200; i++) {
          if(countNodeId[i] === 0) {
            lastNodeId = i;
            break;
          } 
        }
      } else if(selected_link) {
        links.splice(links.indexOf(selected_link), 1);
      }
      selected_link = null;
      selected_node = null;
      restart();
  }
}

function keyup() {
  lastKeyDown = -1;

  if(d3.event.keyCode === 17) {
    circle
      .on('mousedown.drag', null)
      .on('touchstart.drag', null);
    svg.classed('ctrl', false);
  }
}

svg.on('mousedown', mousedown)
   .on('mousemove', mousemove)
   .on('mouseup', mouseup);

d3.select(window)
  .on('keydown', keydown)
  .on('keyup', keyup);
  
restart();