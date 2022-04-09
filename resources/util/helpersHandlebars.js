module.exports = {
    checkViewBox: (a, b) => {
      return a==b ? true : false;
    },
    formatCurrency: number => {
      if(number > 0){
        return (number/100).toFixed(2);
      } else {
        return null;
      }
    },
    discountPercent: (cost, discount) => {
      return Math.floor(100-((discount/cost)*100));
    },
    countIndex: number => {
      return number + 1;
    },
    checkGender: (a, b) => {
      return a===b ? false : true;
    },
    textUppercase: string => {
      return string
          .toLowerCase()
          .split(' ')
          .map(function(Word) {
              return Word[0].toUpperCase() + Word.substr(1);
          })
          .join(' ');
    }
}