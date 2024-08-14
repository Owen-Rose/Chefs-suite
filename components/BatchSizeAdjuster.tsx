import React from "react";
import { Button, Typography, Box } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

interface BatchSizeAdjusterProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
}

const BatchSizeAdjuster: React.FC<BatchSizeAdjusterProps> = ({
  value,
  onChange,
  min = 1,
}) => {
  const handleIncrease = () => {
    onChange(value + 1);
  };

  const handleDecrease = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="center">
      <Button
        onClick={handleDecrease}
        variant="contained"
        style={{ minWidth: "48px", height: "48px" }}
      >
        <RemoveIcon />
      </Button>
      <Typography variant="h6" component="span" mx={2}>
        {value}
      </Typography>
      <Button
        onClick={handleIncrease}
        variant="contained"
        style={{ minWidth: "48px", height: "48px" }}
      >
        <AddIcon />
      </Button>
    </Box>
  );
};

export default BatchSizeAdjuster;
