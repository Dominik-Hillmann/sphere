// measures distance between two points
var distance = function(x, y, middlePos)
{
   return Math.round(Math.sqrt(Math.pow(x - middlePoint.x, 2) + Math.pow(y - middlePoint.y, 2)));
}

// returns the position of a part of a distance
var partialDist = function(start, length, percent)
{
   return start + Math.round(length * percent);
}

//
class ColorGradient
{
   constructor(startR, startG, startB, endR, endG, endB)
   {
      this.start =
      {
         r : startR,
         b : startG,
         g : startB
      };
      this.end =
      {
         r : endR,
         g : endG,
         b : endB
      };
   }
}

// cursor that has information about its own past position
class Cursor
{
   constructor(x, y)
   {
      // x and y position in the last frame
      this.last =
      {
         x : x, // both .last and .now having the same value directly after construction is enough
         y : y
      };
      // x and y position in the current frame
      this.current =
      {
         x : x,
         y : y
      };                                                // only 0.1% of the speed because too fast otherwise
      this.relX = ((this.current.x - WIDTH / 2) / WIDTH) * 0.001;
   }

   // last position is current position and current position is mouseX and mouseY
   update()
   {
      this.last.x = this.current.x;
      this.last.y = this.current.y;
      this.current.x = winMouseX;
      this.current.y = winMouseY;

      this.relX = ((this.current.x - WIDTH / 2) / WIDTH) * 0.05;
   }
}


// creates new vector
class Position
{
   constructor(x, y)
   {
      this.x = x;
      this.y = y;
   }
}


// contains additonal information about the tier of the point
class CirclePos extends Position
{
   constructor(x, y, r, g, b)
   {
      super(x, y);
      this.secondTier = (Math.random() > 0.5); // 50% possibility that the dot will be in the second tier
      this.color =
      {
         r : r,
         g : g,
         b : b
      };
   }
}


// a layer represents a line on which the points can move
class Layer
{
   constructor(x1, y1, x2, y2)
   {
      if(y1 != y2)
         console.error("Borders in layer do not have same height!");

      this.left = new Position(x1, y1);
      this.right = new Position(x2, y2);
      this.layerLen = x2 - x1;
      this.points = [];
   }

   // new point that will move along this layer's height between left.x and right.x
   newPointsOnLayer(howMany)
   {
      // first decide, how many points there will be on this layer
      var layerLen = this.right.x - this.left.x;
      // top to bottom: each layer is divided into unequal parts:
      // the first 0 to 10 percent, 10 to 25 percent, 25 to 75 percent, 75 to 90, 90 to 100 percent
      // the smaller areas on the side are supposed to have a bigger probability of points falling into them
      var area1Left = // first left
      [
         this.left.x,
         partialDist(this.left.x, layerLen, 0.1)
      ];
      var area2Left = // second left
      [
         partialDist(this.left.x, layerLen, 0.1),
         partialDist(this.left.x, layerLen, 0.25)
      ];
      var area3 = // middle
      [
         partialDist(this.left.x, layerLen, 0.25),
         partialDist(this.left.x, layerLen, 0.75)
      ];
      var area2Right = // second right
      [
         partialDist(this.left.x, layerLen, 0.75),
         partialDist(this.left.x, layerLen, 0.9)
      ];
      var area1Right = // frist right
      [
         partialDist(this.left.x, layerLen, 0.9),
         this.right.x
      ];
      // DAMIT NICHT ZU HARTE KANTEN BEREICHE UEBERLAPPEN LASSEN
      // here is where the areas are assigned probabilities of points falling into them
      // we want 50 percent for area1, 30 for area2, 20 for area3
      var odds = Math.random();
      var selectedAreas;

      if(odds < 0.5) // if odds are around 50 percent, area1 gets selected
         selectedAreas = [area1Left, area1Right];
      else if((odds > 0.5) && (odds < 0.8)) // other 30 percent, area2 will be selected
         selectedAreas = [area2Left, area2Right];
      else // the other 20 percent, so 0.8 to 1.0 will get area3 selected
         selectedAreas = area3;

      // both parts of an area need to be selected because both together have the overall probability assigned
      // since areas 1 and 2 are divided into two and area 3 is kept together, they need to be treated differently
      if(selectedAreas[0].length == 2) // so area 1 or 2
      {
         var iterationArea; // to select left or right half based on random number
         for(var i = 1; i <= howMany; i++)
         {
            var randPos = Math.random(); // new random position within selectedArea every iteration
            if((randPos <= 0.5) && (selectedAreas.length == 2)) // whether to choose left or right side
               iterationArea = selectedAreas[0];
            else
               iterationArea = selectedAreas[1];

            this.points.push(new CirclePos
            (
               map(Math.random(), 0, 1, iterationArea[0], iterationArea[1]),
               this.left.y,
               255,
               255,
               255
            )); // then finally push new point in array that contains this layer's points
         } // for
      }
      else // so area 3 is selected --> no need to decide between
      {
         for(var i = 1; i <= howMany; i++)
         {
            this.points.push(new CirclePos
            (
               map(Math.random(), 0, 1, selectedAreas[0], selectedAreas[1]),
               this.left.y
            ));
         }
      } // else
   } // newPointsOnLayer

   movePoints(cursor)
   {
      if(CURSOR_MOVE) // rotation follows the cursor
      {
         for(var i = 0; i < this.points.length; i++)
         {
            var point = this.points[i];
            if(point.secondTier)
               point.x += this.layerLen * (-1 * cursor.relX);
            else
               point.x += this.layerLen * cursor.relX;
            // at last, the change of direction, if the point happens to step over the layer's border
            if((point.x > this.right.x) || (point.x < this.left.x))
               point.secondTier = !point.secondTier;
         }
      }
      else  // sphere rotates with time/frames
      {
         for(var i = 0; i < this.points.length; i++)
         {
            var point = this.points[i];
            if(point.secondTier)
               point.x += this.layerLen * (-1 * 0.001);
            else
               point.x += this.layerLen * 0.001;
            // at last, the change of direction, if the point happens to step over the layer's border
            if((point.x > this.right.x) || (point.x < this.left.x))
               point.secondTier = !point.secondTier;
         }
      }
   }

   // sets
   colorize(startPoint, cg)
   {
      // startPoint: point where color gradient starts
      for(var i = 0; i < this.points.length; i++)
      {
         var point = this.points[i];
         var dist = distance(point.x, point.x, startPoint);
         point.color.r = Math.round(map(dist, 0, SPHERE_RADIUS, cg.start.r, cg.end.r));
         point.color.g = Math.round(map(dist, 0, SPHERE_RADIUS, cg.start.g, cg.end.g));
         point.color.b = Math.round(map(dist, 0, SPHERE_RADIUS, cg.start.b, cg.end.b));
      }
   }

   // draws the array of points in this layer
   drawPoints(size1stTier, size2ndTier)
   {
      for(var i = 0; i < this.points.length; i++)
      {
         var point = this.points[i];
         var r = point.color.r;
         var g = point.color.g;
         var b = point.color.b;
         var x = point.x;
         var y = point.y;
         var alpha = 255;

         stroke(r, g, b);
         fill(r, g, b);

         // three drawings with three alphas


         if(point.secondTier)
         {
            for(var j = 0; j < 3; j++)
            {
               stroke(r, g, b, alpha)
               fill(r, g, b, alpha);
               ellipse(x, y, size2ndTier);
               x -= 2;
               y -= 2;
               alpha -= 90;
            }
         }
         else
            ellipse(point.x, point.y, size1stTier);

         for(var j = 0; j < 3; j++)
         {
            stroke(r, g, b, alpha)
            fill(r, g, b, alpha);
            if(point.secondTier)
               ellipse(x, y, size2ndTier);
            else
               ellipse(x, y, size1stTier);
            x -= 2;
            y -= 2;
            alpha -= 90;
         }
      }
   }

   // draws a line between the left point of the layer and the right point
   drawLine()
   {
      line(this.left.x, this.left.y, this.right.x, this.right.y);
   }
}
