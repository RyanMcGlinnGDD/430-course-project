const gamePage = (req, res) => {
  res.render('app', { csrfToken: req.csrfToken() });
};

// export the relevant public controller functions
module.exports = {
  gamePage,
};
