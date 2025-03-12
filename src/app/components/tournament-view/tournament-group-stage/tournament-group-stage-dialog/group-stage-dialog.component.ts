import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatRadioModule } from "@angular/material/radio";

@Component({
  selector: "app-group-stage-dialog",
  templateUrl: "./group-stage-dialog.component.html",
  standalone: true,
  imports: [MatDialogActions, MatRadioModule, MatDialogContent, FormsModule],
  styleUrls: ["./group-stage-dialog.component.scss"],
})
export class GroupStageDialogComponent {
  qualifyingPlayers: number = 8;

  constructor(public dialogRef: MatDialogRef<GroupStageDialogComponent>) {}

  confirm() {
    this.dialogRef.close(this.qualifyingPlayers);
  }

  close() {
    this.dialogRef.close();
  }
}
